import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/gd/page-header";
import { EmptyState } from "@/components/gd/empty-state";
import { requireTeamMember } from "@/server/team";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const member = await requireTeamMember();
  return (
    <>
      <PageHeader title="Overview" description={`Signed in as ${member.displayName ?? member.email}.`} />
      <EmptyState icon={LayoutDashboard} title="Nothing needs attention">
        Enquiries with missing details, drafts waiting for approval and balances coming due will appear here.
      </EmptyState>
    </>
  );
}
