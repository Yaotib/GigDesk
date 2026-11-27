import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/gd/page-header";
import { EmptyState } from "@/components/gd/empty-state";

export const metadata: Metadata = { title: "Quotes & invoices" };

export default function Page() {
  return (
    <>
      <PageHeader title="Quotes & invoices" />
      <EmptyState icon={FileText} title="No quotes yet">
        Draft and approved quotes will be listed here with their GD numbers.
      </EmptyState>
    </>
  );
}
