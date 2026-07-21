"use client";

/**
 * Hash-to-focus controller for the production API reference surface.
 *
 * On load, hashchange, and popstate (back/forward), scrolls and focuses the
 * operation section whose stable `id` matches the location hash. Does not
 * rewrite canonical operation content.
 */

import { type ReactNode, useCallback, useEffect, useRef } from "react";
import {
  API_HASH_CONTROLLER_ATTR,
  API_HASH_FOCUSED_ATTR,
  API_OPERATION_ANCHOR_ATTR,
  API_OPERATION_SECTION_ATTR,
  readLocationHashAnchor,
} from "./operation-anchors";

export type ApiReferenceHashControllerProps = {
  children?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearHashFocusedMarkers(root: ParentNode): void {
  const focused = root.querySelectorAll(`[${API_HASH_FOCUSED_ATTR}]`);
  for (const node of focused) {
    node.removeAttribute(API_HASH_FOCUSED_ATTR);
  }
}

function findOperationSection(
  root: ParentNode,
  anchor: string,
): HTMLElement | null {
  const byId =
    typeof Document !== "undefined" && root instanceof Document
      ? root.getElementById(anchor)
      : root.querySelector(`#${CSS.escape(anchor)}`);
  if (byId instanceof HTMLElement) {
    return byId;
  }

  const sections = root.querySelectorAll(`[${API_OPERATION_SECTION_ATTR}]`);
  for (const section of sections) {
    if (
      section instanceof HTMLElement &&
      section.getAttribute(API_OPERATION_ANCHOR_ATTR) === anchor
    ) {
      return section;
    }
  }
  return null;
}

/**
 * Focus and scroll the operation section for `anchor` within `root`.
 * Returns true when a matching section was found.
 */
export function focusApiOperationAnchor(
  root: ParentNode,
  anchor: string,
  options?: { reduceMotion?: boolean },
): boolean {
  const trimmed = readLocationHashAnchor(anchor);
  if (trimmed.length === 0) {
    clearHashFocusedMarkers(root);
    return false;
  }

  const target = findOperationSection(root, trimmed);
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  clearHashFocusedMarkers(root);
  target.setAttribute(API_HASH_FOCUSED_ATTR, "");

  if (!target.hasAttribute("tabindex")) {
    target.tabIndex = -1;
  }

  const reduceMotion = options?.reduceMotion ?? prefersReducedMotion();
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
  target.focus({ preventScroll: true });
  return true;
}

/**
 * Client controller that syncs location hash → operation section focus.
 * Renders children unchanged; back/forward restore prior hash focus via
 * `hashchange` / `popstate` without mutating operation content.
 */
export function ApiReferenceHashController({
  children,
  className,
  "data-testid": testId = "api-reference-hash-controller",
}: ApiReferenceHashControllerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const syncFromLocation = useCallback(() => {
    const root = rootRef.current ?? document;
    focusApiOperationAnchor(root, window.location.hash);
  }, []);

  useEffect(() => {
    syncFromLocation();
    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);
    return () => {
      window.removeEventListener("hashchange", syncFromLocation);
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, [syncFromLocation]);

  return (
    <div
      className={className}
      data-testid={testId}
      ref={rootRef}
      {...{ [API_HASH_CONTROLLER_ATTR]: "" }}
    >
      {children}
    </div>
  );
}
