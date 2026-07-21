"use client";

import { useEffect } from "react";

/**
 * Focus + scroll the element matching `location.hash`. Shared across API /
 * events / schema reference surfaces so deep links land keyboard focus without
 * rewriting contract content. Re-runs on hashchange after client navigation.
 */

export function focusReferenceHashTarget(
  root: ParentNode | null | undefined = typeof document !== "undefined"
    ? document
    : null,
  hash: string | undefined = typeof window !== "undefined"
    ? window.location.hash
    : undefined,
  options?: { reduceMotion?: boolean },
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

  const reduceMotion =
    options?.reduceMotion ??
    (typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);

  target.scrollIntoView({
    block: "start",
    behavior: reduceMotion ? "auto" : "smooth",
  });
  target.focus({ preventScroll: true });
  return target;
}

export type ReferenceHashNavigationProps = {
  /** Optional root selector; defaults to document. */
  rootSelector?: string;
  "data-testid"?: string;
};

/**
 * Client mount that focuses/scrolls to the current hash target on load and
 * hashchange. Renders an invisible marker for tests.
 */
export function ReferenceHashNavigation({
  rootSelector,
  "data-testid": testId = "reference-hash-navigation",
}: ReferenceHashNavigationProps) {
  useEffect(() => {
    const root =
      rootSelector !== undefined && rootSelector.length > 0
        ? document.querySelector(rootSelector)
        : document;

    const run = () => {
      focusReferenceHashTarget(root, window.location.hash);
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
      data-reference-hash-navigation=""
      data-testid={testId}
      hidden
    />
  );
}
