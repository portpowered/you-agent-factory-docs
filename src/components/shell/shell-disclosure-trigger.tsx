"use client";

import { Button } from "@/components/ui/button";
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
    <Button
      aria-controls={disclosure.panelId}
      aria-expanded={disclosure.isEnabled ? disclosure.isOpen : false}
      className={className}
      id={disclosure.triggerId}
      onClick={disclosure.isEnabled ? disclosure.toggle : undefined}
      ref={disclosure.triggerRef}
      variant="secondary"
    >
      {children({ isOpen: disclosure.isOpen })}
    </Button>
  );
}
