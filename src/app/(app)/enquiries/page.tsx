import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/gd/page-header";
import { EmptyState } from "@/components/gd/empty-state";

export const metadata: Metadata = { title: "Enquiries" };

export default function Page() {
  return (
    <>
      <PageHeader title="Enquiries" />
      <EmptyState icon={Inbox} title="No enquiries yet">
        Enquiries you add from WhatsApp chats, emails, notes or voice notes will be listed here.
      </EmptyState>
    </>
  );
}
