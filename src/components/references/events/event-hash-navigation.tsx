"use client";

import { useEffect } from "react";

/**
 * Focus + scroll the element matching `location.hash` inside the events
 * surface. Re-runs on hashchange so deep links work after client navigation.
 * No-ops when the hash is empty or the target is missing.
 */
export function focusEventHashTarget(
  root: ParentNode | null | undefined = typeof document !== "undefined"
    ? document
    : null,
  hash: string | undefined = typeof window !== "undefined"
    ? window.location.hash
    : undefined,
): HTMLElement | null {
  if (root === null || root === undefined) {
    return null;
  }
  const fragment = (hash ?? "").replace(/^#/, "").trim();
  if (fragment.length === 0) {
    return null;
  }

  let target: Element | null = null;
  if ("getElementById" in root && typeof root.getElementById === "function") {
    target = root.getElementById(fragment);
  } else if ("querySelector" in root) {
    target = root.querySelector(`#${CSS.escape(fragment)}`);
  }
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  if (!target.hasAttribute("tabindex")) {
    target.tabIndex = -1;
  }
  target.scrollIntoView({ block: "start", behavior: "auto" });
  target.focus({ preventScroll: true });
  return target;
}

export type EventHashNavigationProps = {
  /** Optional root selector; defaults to document. */
  rootSelector?: string;
  "data-testid"?: string;
};

/**
 * Client mount that focuses/scrolls to the current hash target on load and
 * hashchange. Renders an invisible marker for tests.
 */
export function EventHashNavigation({
  rootSelector,
  "data-testid": testId = "event-hash-navigation",
}: EventHashNavigationProps) {
  useEffect(() => {
    const root =
      rootSelector !== undefined && rootSelector.length > 0
        ? document.querySelector(rootSelector)
        : document;

    const run = () => {
      focusEventHashTarget(root, window.location.hash);
    };

    run();
    window.addEventListener("hashchange", run);
    return () => {
      window.removeEventListener("hashchange", run);
    };
  }, [rootSelector]);

  return (
    <span
      aria-hidden="true"
      className="sr-only"
      data-event-hash-navigation=""
      data-testid={testId}
      hidden
    />
  );
}
