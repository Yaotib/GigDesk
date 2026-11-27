import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/gd/page-header";
import { EmptyState } from "@/components/gd/empty-state";

export const metadata: Metadata = { title: "Upcoming events" };

export default function Page() {
  return (
    <>
      <PageHeader title="Upcoming events" />
      <EmptyState icon={CalendarDays} title="No upcoming events">
        Booked events with a date from today onwards will be listed here.
      </EmptyState>
    </>
  );
}
