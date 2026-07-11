import { prisma } from "./db";

/** A user counts as "logged in" if their session was active in the last 30 minutes. */
const ACTIVE_WINDOW_MS = 30 * 60 * 1000;

export const CATEGORIES = ["elite_special", "call_sheet"] as const;
export type Category = (typeof CATEGORIES)[number];

export const INITIAL_BATCH = 10; // leads shown on a fresh login
export const RELOGIN_TOUCHED = 2; // last touched leads shown on top after re-login
export const RELOGIN_FRESH = 8; // fresh leads below them
export const ROLL_TRIGGER = 8; // touches that trigger a roll
export const ROLL_HIDE = 7; // touched leads hidden on a roll
export const ROLL_LOAD = 8; // fresh leads loaded on a roll

async function countActiveUsers(): Promise<number> {
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
  // Only Agents + Managers take part in lead distribution.
  const rows = await prisma.session.findMany({
    where: {
      isActive: true,
      lastActivity: { gte: cutoff },
      user: { role: { in: ["manager", "agent"] } },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return Math.max(rows.length, 1);
}

/**
 * Assigns up to `requested` fresh leads from the pool to a user, honouring the
 * fair-split rule: when the pool cannot give every logged-in user `requested`
 * leads, each user only gets floor(pool / activeUsers) (minimum 1 while the
 * pool is non-empty). Already-assigned untouched leads belonging to the user
 * are reused first — an assigned lead stays with its user until touched.
 */
export async function takeFreshLeads(
  userId: number,
  category: Category,
  requested: number,
  excludeIds: number[] = []
): Promise<number[]> {
  if (requested <= 0) return [];

  // 1. Reuse the user's own still-assigned untouched leads first.
  const mine = await prisma.lead.findMany({
    where: {
      category,
      status: "fresh",
      assignedToId: userId,
      id: { notIn: excludeIds },
    },
    orderBy: { createdAt: "asc" },
    take: requested,
    select: { id: true },
  });
  const ids = mine.map((l) => l.id);
  let remaining = requested - ids.length;
  if (remaining <= 0) return ids;

  // 2. Pull from the unassigned fresh pool with the fair-split cap.
  // Each active user is entitled to floor(totalFresh / activeUsers) so that
  // e.g. 120 fresh leads across 20 logged-in users yields 6 each, regardless
  // of who is served first. A user's already-held untouched leads count
  // against their entitlement.
  const activeUsers = await countActiveUsers();
  const [pool, totalFresh, myAssignedFresh] = await Promise.all([
    prisma.lead.count({ where: { category, status: "fresh", assignedToId: null } }),
    prisma.lead.count({ where: { category, status: "fresh" } }),
    prisma.lead.count({ where: { category, status: "fresh", assignedToId: userId } }),
  ]);
  if (pool <= 0) return ids;

  let grant: number;
  if (totalFresh >= remaining * activeUsers + myAssignedFresh) {
    grant = remaining; // plenty of supply for everyone
  } else {
    const entitlement = Math.floor(totalFresh / activeUsers);
    grant = Math.min(remaining, Math.max(entitlement - myAssignedFresh, 0));
    if (grant === 0 && myAssignedFresh === 0) grant = Math.min(remaining, 1); // never starve while pool > 0
  }
  grant = Math.min(grant, pool);
  if (grant <= 0) return ids;

  // Claim atomically so no two users ever receive the same lead.
  const claimed = await prisma.$transaction(async (tx) => {
    const candidates = await tx.lead.findMany({
      where: { category, status: "fresh", assignedToId: null },
      orderBy: { createdAt: "asc" },
      take: grant,
      select: { id: true },
    });
    const candidateIds = candidates.map((c) => c.id);
    if (!candidateIds.length) return [] as number[];
    await tx.lead.updateMany({
      where: { id: { in: candidateIds }, assignedToId: null },
      data: { assignedToId: userId },
    });
    return candidateIds;
  });

  return [...ids, ...claimed];
}

interface WindowState {
  visibleIds: number[];
  touchedQueue: number[];
  newTouches: number;
}

function parseState(row: { visibleIds: string; touchedQueue: string; newTouches: number }): WindowState {
  return {
    visibleIds: JSON.parse(row.visibleIds),
    touchedQueue: JSON.parse(row.touchedQueue),
    newTouches: row.newTouches,
  };
}

/**
 * Returns the user's rolling-window state for a category, (re)building it when
 * the user has logged in again since it was last built.
 *
 * Re-login rule: last 2 touched leads (across both menus combined) on top
 * + 8 fresh below = 10 to start. First-ever login: 10 fresh.
 */
export async function getOrBuildMenuState(
  userId: number,
  sessionId: string,
  category: Category
): Promise<WindowState> {
  const existing = await prisma.menuState.findUnique({
    where: { userId_category: { userId, category } },
  });
  if (existing && existing.sessionId === sessionId) return parseState(existing);

  const everTouched = await prisma.lead.count({ where: { touchedById: userId } });

  let visibleIds: number[] = [];
  if (everTouched === 0) {
    visibleIds = await takeFreshLeads(userId, category, INITIAL_BATCH);
  } else {
    const lastTouched = await prisma.lead.findMany({
      where: { touchedById: userId },
      orderBy: { touchedAt: "desc" },
      take: RELOGIN_TOUCHED,
      select: { id: true },
    });
    const topIds = lastTouched.map((l) => l.id);
    const fresh = await takeFreshLeads(userId, category, RELOGIN_FRESH, topIds);
    visibleIds = [...topIds, ...fresh];
  }

  const data = {
    sessionId,
    visibleIds: JSON.stringify(visibleIds),
    touchedQueue: "[]",
    newTouches: 0,
  };
  await prisma.menuState.upsert({
    where: { userId_category: { userId, category } },
    update: data,
    create: { userId, category, ...data },
  });

  return { visibleIds, touchedQueue: [], newTouches: 0 };
}

/**
 * Registers a first-touch on a visible lead and applies the 10 -> 11 rule:
 * after 8 first-touches, the first 7 touched leads hide and 8 fresh load below.
 */
export async function registerTouch(
  userId: number,
  sessionId: string,
  category: Category,
  leadId: number
): Promise<void> {
  const state = await getOrBuildMenuState(userId, sessionId, category);
  if (state.touchedQueue.includes(leadId)) return;

  state.touchedQueue.push(leadId);
  state.newTouches += 1;

  if (state.newTouches >= ROLL_TRIGGER) {
    const toHide = state.touchedQueue.slice(0, ROLL_HIDE);
    state.touchedQueue = state.touchedQueue.slice(ROLL_HIDE);
    state.visibleIds = state.visibleIds.filter((id) => !toHide.includes(id));
    const fresh = await takeFreshLeads(userId, category, ROLL_LOAD, state.visibleIds);
    state.visibleIds = [...state.visibleIds, ...fresh];
    state.newTouches = 0;
  }

  await prisma.menuState.update({
    where: { userId_category: { userId, category } },
    data: {
      visibleIds: JSON.stringify(state.visibleIds),
      touchedQueue: JSON.stringify(state.touchedQueue),
      newTouches: state.newTouches,
    },
  });
}

/**
 * After a new upload, tops active users' windows for that category back up
 * toward 10 visible leads.
 */
export async function topUpActiveUsers(category: Category): Promise<void> {
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
  const sessions = await prisma.session.findMany({
    where: { isActive: true, lastActivity: { gte: cutoff } },
    select: { userId: true },
    distinct: ["userId"],
  });
  for (const { userId } of sessions) {
    const row = await prisma.menuState.findUnique({
      where: { userId_category: { userId, category } },
    });
    if (!row) continue;
    const state = parseState(row);
    const deficit = INITIAL_BATCH - state.visibleIds.length;
    if (deficit <= 0) continue;
    const fresh = await takeFreshLeads(userId, category, deficit, state.visibleIds);
    if (!fresh.length) continue;
    await prisma.menuState.update({
      where: { userId_category: { userId, category } },
      data: { visibleIds: JSON.stringify([...state.visibleIds, ...fresh]) },
    });
  }
}
