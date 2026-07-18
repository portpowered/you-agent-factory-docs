"use client";

/**
 * Events-family hash focus chrome. Wraps the shared reference hash navigation
 * helper and keeps the events-specific marker attribute for existing probes.
 */

import {
  focusReferenceHashTarget,
  ReferenceHashNavigation,
  type ReferenceHashNavigationProps,
} from "@/components/references/shared/ReferenceHashNavigation";

export {
  focusReferenceHashTarget as focusEventHashTarget,
  type ReferenceHashNavigationProps as EventHashNavigationProps,
};

export function EventHashNavigation({
  rootSelector,
  "data-testid": testId = "event-hash-navigation",
}: ReferenceHashNavigationProps) {
  return (
    <span data-event-hash-navigation="">
      <ReferenceHashNavigation
        data-testid={testId}
        rootSelector={rootSelector}
      />
    </span>
  );
}
