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
  if (!disclosure.isEnabled) {
    return null;
  }

  return (
    <button
      aria-controls={disclosure.panelId}
      aria-expanded={disclosure.isOpen}
      className={className}
      id={disclosure.triggerId}
      onClick={disclosure.toggle}
      ref={disclosure.triggerRef}
      type="button"
    >
      {children({ isOpen: disclosure.isOpen })}
    </button>
  );
}
