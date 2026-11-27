import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/gd/page-header";
import { EmptyState } from "@/components/gd/empty-state";

export const metadata: Metadata = { title: "Business settings" };

export default function Page() {
  return (
    <>
      <PageHeader title="Business settings" />
      <EmptyState icon={Settings} title="No settings saved yet">
        Rates, lineups, payment details and terms will be edited here.
      </EmptyState>
    </>
  );
}
