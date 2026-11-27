import { CalendarDays, FileText, Inbox, LayoutDashboard, Music2, Settings, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavSection = { label: string; items: NavItem[] };

/** Navigation and icons exactly as in the brand book. */
export const NAV: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/enquiries", label: "Enquiries", icon: Inbox },
      { href: "/events", label: "Upcoming events", icon: CalendarDays },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/quotes", label: "Quotes & invoices", icon: FileText },
      { href: "/riders", label: "Production riders", icon: Music2 },
    ],
  },
  {
    label: "Configuration",
    items: [{ href: "/settings", label: "Business settings", icon: Settings }],
  },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
