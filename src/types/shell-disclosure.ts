import type { RefObject } from "react";

/** Projected UI state for narrow-viewport shell navigation disclosure. */
export type ShellDisclosureState = {
  /** True when narrow-viewport disclosure behavior is active. */
  isEnabled: boolean;
  /** Open state; meaningful only when `isEnabled` is true. */
  isOpen: boolean;
  /** True when the disclosed panel should be visible to users and assistive tech. */
  isPanelVisible: boolean;
  panelId: string;
  triggerId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  open: () => void;
  close: () => void;
  toggle: () => void;
};
