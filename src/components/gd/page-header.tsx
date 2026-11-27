"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { BrandMark, NavList, SignOutBlock } from "./sidebar";

type PageHeaderProps = {
  title: string;
  /** The single primary action of the view. Desktop: right of the title. Mobile: bottom bar. */
  primaryAction?: React.ReactNode;
  /** Secondary actions (default/ghost buttons) next to the title on desktop and above the content on mobile. */
  secondaryActions?: React.ReactNode;
  description?: React.ReactNode;
};

/**
 * Page header from the AppShell spec.
 * Below 768px: dark top bar with a menu sheet, and the primary action pinned in a bottom bar.
 */
export function PageHeader({ title, primaryAction, secondaryActions, description }: PageHeaderProps) {
  return (
    <>
      <MobileTopBar title={title} />

      <div className="mb-6 flex flex-col gap-2 md:mb-8">
        <header className="hidden items-center justify-between gap-4 md:flex">
          <h1 className="page-title m-0 min-w-0 truncate">{title}</h1>
          {(secondaryActions || primaryAction) && (
            <div className="flex items-center gap-2">
              {secondaryActions}
              {primaryAction}
            </div>
          )}
        </header>
        {secondaryActions && <div className="flex flex-wrap gap-2 md:hidden">{secondaryActions}</div>}
        {description && <div className="body text-ink-muted">{description}</div>}
      </div>

      {primaryAction && (
        <div
          data-testid="mobile-action-bar"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden [&>*]:w-full"
        >
          {primaryAction}
        </div>
      )}
    </>
  );
}

function MobileTopBar({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-4 flex h-14 items-center gap-2 bg-sidebar px-2 text-sidebar-ink md:hidden">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className="grid size-11 place-items-center rounded-md hover:bg-sidebar-raised focus-visible:outline-sidebar-ink"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(85vw,280px)] flex-col overflow-y-auto bg-sidebar px-3 py-4 shadow-overlay">
            <div className="flex items-start justify-between">
              <BrandMark />
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="grid size-11 place-items-center rounded-md text-sidebar-ink hover:bg-sidebar-raised focus-visible:outline-sidebar-ink"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <Dialog.Description className="sr-only">Move between GigDesk sections.</Dialog.Description>
            <NavList onNavigate={() => setOpen(false)} />
            <SignOutBlock />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <h1 className="section-title m-0 min-w-0 truncate">{title}</h1>
    </div>
  );
}
