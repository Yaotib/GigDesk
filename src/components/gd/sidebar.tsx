"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Music2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { signOut } from "@/server/auth-actions";
import { NAV, isActive } from "./nav";
import { useShellUser } from "./shell-context";

export function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-2 pb-4 body-strong text-sidebar-ink">
      <span className="grid size-6 place-items-center rounded-sm bg-accent text-on-accent" aria-hidden>
        <Music2 className="size-4" />
      </span>
      GigDesk
    </div>
  );
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {NAV.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <span className="label px-2 pt-3 pb-1 text-sidebar-muted">{section.label}</span>
          {section.items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2 rounded-md px-2 text-sidebar-ink md:h-9",
                  "hover:bg-sidebar-raised focus-visible:outline-sidebar-ink",
                  active &&
                    "bg-sidebar-raised before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-[3px] before:rounded-r-sm before:bg-accent",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SignOutBlock() {
  const user = useShellUser();
  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-raised px-2 pt-4">
      <div className="min-w-0">
        <p className="small truncate text-sidebar-ink">{user.displayName ?? user.email}</p>
        <p className="label truncate text-sidebar-muted">{user.canApprove ? "Can approve quotes" : "Team member"}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex h-11 w-full items-center gap-2 rounded-md px-2 text-sidebar-ink hover:bg-sidebar-raised focus-visible:outline-sidebar-ink md:h-9"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </button>
      </form>
    </div>
  );
}

/** Desktop sidebar, 232px, shown from 768px. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col overflow-y-auto bg-sidebar px-3 py-4 md:flex">
      <BrandMark />
      <NavList />
      <SignOutBlock />
    </aside>
  );
}
