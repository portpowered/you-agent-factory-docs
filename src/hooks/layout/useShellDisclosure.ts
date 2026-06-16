"use client";

import { useResponsiveShellState } from "@/hooks/layout/useResponsiveShellState";
import type { ShellDisclosureState } from "@/types/shell-disclosure";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type UseShellDisclosureOptions = {
  /** Stable id for the disclosed panel; auto-generated when omitted. */
  panelId?: string;
};

/**
 * Reusable narrow-viewport shell disclosure behavior.
 * Open/closed state is projected UI state, not canonical shell configuration.
 */
export function useShellDisclosure(
  options: UseShellDisclosureOptions = {},
): ShellDisclosureState {
  const generatedId = useId();
  const panelId = options.panelId ?? `shell-disclosure-panel-${generatedId}`;
  const triggerId = `${panelId}-trigger`;

  const { isNarrowViewport } = useResponsiveShellState();
  const isEnabled = isNarrowViewport;

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((previous) => !previous);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      setIsOpen(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled || !isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, isEnabled, isOpen]);

  const isPanelVisible = !isEnabled || isOpen;

  return {
    isEnabled,
    isOpen,
    isPanelVisible,
    panelId,
    triggerId,
    triggerRef,
    open,
    close,
    toggle,
  };
}
