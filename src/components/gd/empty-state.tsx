import type { LucideIcon } from "lucide-react";

/** Plain empty state: no card, an icon, one line of copy. */
export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-2 border-t border-line pt-6">
      <Icon className="size-5 text-ink-muted" aria-hidden />
      <h2 className="section-title m-0">{title}</h2>
      {children && <p className="body m-0 max-w-prose text-ink-muted">{children}</p>}
    </section>
  );
}
