/** Centralized route definitions for the LemenX dashboard. */
export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",

  dashboard: "/dashboard",

  finance: {
    overview: "/dashboard/finance",
    transactions: "/dashboard/finance/transactions",
    categories: "/dashboard/finance/categories",
    reports: "/dashboard/finance/reports",
  },

  notes: {
    list: "/dashboard/notes",
    detail: (id: string) => `/dashboard/notes/${id}`,
  },

  settings: {
    general: "/dashboard/settings",
    profile: "/dashboard/settings/profile",
    billing: "/dashboard/settings/billing",
    domain: "/dashboard/settings/domain",
    members: "/dashboard/settings/members",
  },

  admin: {
    overview: "/admin",
    tenants: "/admin/tenants",
    users: "/admin/users",
    subscriptions: "/admin/subscriptions",
  },
} as const;
