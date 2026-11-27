import { Sidebar } from "@/components/gd/sidebar";
import { ShellProvider } from "@/components/gd/shell-context";
import { requireTeamMember } from "@/server/team";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await requireTeamMember();
  return (
    <ShellProvider user={{ email: member.email, displayName: member.displayName, canApprove: member.canApprove }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="min-h-dvh md:pl-sidebar">
        <main id="main" className="mx-auto max-w-content px-4 pt-4 pb-28 md:px-6 md:pt-12 md:pb-12">
          {children}
        </main>
      </div>
    </ShellProvider>
  );
}
