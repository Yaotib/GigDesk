import type { Metadata } from "next";
import { Music2 } from "lucide-react";
import { PageHeader } from "@/components/gd/page-header";
import { EmptyState } from "@/components/gd/empty-state";

export const metadata: Metadata = { title: "Production riders" };

export default function Page() {
  return (
    <>
      <PageHeader title="Production riders" />
      <EmptyState icon={Music2} title="No riders yet">
        Technical riders for approved quotes will be listed here.
      </EmptyState>
    </>
  );
}
