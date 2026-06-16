"use client";

import type { ShellDisclosureState } from "@/types/shell-disclosure";
import type { ReactNode } from "react";

type ShellDisclosureTriggerProps = {
  disclosure: ShellDisclosureState;
  className?: string;
  children: (state: { isOpen: boolean }) => ReactNode;
};

/** Keyboard-safe disclosure trigger for narrow-viewport shell navigation. */
export function ShellDisclosureTrigger({
  disclosure,
  className,
  children,
}: ShellDisclosureTriggerProps) {
  return (
    <button
      aria-controls={disclosure.panelId}
      aria-expanded={disclosure.isEnabled ? disclosure.isOpen : false}
      className={className}
      id={disclosure.triggerId}
      onClick={disclosure.isEnabled ? disclosure.toggle : undefined}
      ref={disclosure.triggerRef}
      type="button"
    >
      {children({ isOpen: disclosure.isOpen })}
    </button>
  );
}
