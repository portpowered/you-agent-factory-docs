"use client";

import { useCallback, useState } from "react";

export type SharedShellNavigationDisclosureState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

/**
 * Projected shell state for narrow-width primary navigation disclosure.
 * Canonical labels and breakpoints live in sharedShellConfig.responsive.
 */
export function useSharedShellNavigationDisclosure(
  initialOpen = false,
): SharedShellNavigationDisclosureState {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
