"use client";

import type { ShellDisclosureState } from "@/types/shell-disclosure";
import type { ReactNode } from "react";

type ShellDisclosurePanelProps = {
  disclosure: ShellDisclosureState;
  className?: string;
  children: ReactNode;
};

/** Disclosed shell region whose visibility is projected UI state on narrow viewports. */
export function ShellDisclosurePanel({
  disclosure,
  className,
  children,
}: ShellDisclosurePanelProps) {
  return (
    <div
      className={className}
      data-shell-disclosure={
        disclosure.isEnabled
          ? disclosure.isOpen
            ? "open"
            : "closed"
          : undefined
      }
      hidden={disclosure.isEnabled && !disclosure.isOpen ? true : undefined}
      id={disclosure.panelId}
    >
      {children}
    </div>
  );
}
