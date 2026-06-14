import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

/**
 * Authenticated workspace shell: fixed sidebar + sticky header.
 * Tenant + user data will be wired through here once auth lands;
 * for now we pass sensible defaults so the shell renders standalone.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const workspaceName = "Abemuth";
  const userName = "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <div className="hidden md:flex">
        <Sidebar workspaceName={workspaceName} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={userName} />
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
