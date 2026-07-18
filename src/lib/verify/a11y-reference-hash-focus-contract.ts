/**
 * W19 hash-focus, sticky-chrome visibility, and mobile-collapse contract for
 * representative Factory reference surfaces. Extends existing keyboard /
 * reduced-motion harnesses — does not invent a parallel focus framework.
 *
 * Keep selectors mirrored from the components layer (do not import
 * `@/components` into verify/).
 */

import {
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";

export type ReferenceHashTargetKind =
  | "api-operation"
  | "event-payload"
  | "schema-definition";

export type ReferenceHashTargetSpec = {
  id: string;
  kind: ReferenceHashTargetKind;
  /**
   * CSS selector for a representative hash target on the route. Probes focus
   * the element's `id` fragment.
   */
  selector: string;
  label: string;
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
  /**
   * When true, the target must expose a scroll-margin / `scroll-mt-*` class so
   * sticky chrome cannot fully hide the focused heading after scrollIntoView.
   */
  requireScrollMargin: boolean;
};

export type ReferenceMobileNavSpec = {
  id: string;
  /** Host selector for the collapsible page-local navigator (`details`). */
  hostSelector: string;
  /** Disclosure control inside the host (usually `summary`). */
  summarySelector: string;
  label: string;
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
  collapseMechanism: "details-summary";
  defaultOpen: false;
};

/**
 * Representative hash targets for operation / event / schema deep links.
 * Selectors match production chrome markers, not harness-only ids.
 */
export const REFERENCE_HASH_TARGETS: readonly ReferenceHashTargetSpec[] = [
  {
    id: "api-operation-section",
    kind: "api-operation",
    selector: "[data-api-operation-section]",
    label: "API operation section hash target",
    required: true,
    routeIds: ["references-api"],
    requireScrollMargin: true,
  },
  {
    id: "event-payload-variant",
    kind: "event-payload",
    selector: "[data-event-payload-only][data-event-type]",
    label: "Event payload / type hash target",
    required: true,
    routeIds: ["references-events"],
    requireScrollMargin: true,
  },
  {
    id: "schema-definition",
    kind: "schema-definition",
    selector: "[data-schema-definition-pointer]",
    label: "Schema definition hash target",
    required: true,
    routeIds: ["references-factory-schema"],
    requireScrollMargin: true,
  },
] as const;

/**
 * Page-local collapsible reference navigation for narrow layouts.
 * Production API uses `<details data-api-mobile-navigator>` (W08).
 */
export const REFERENCE_MOBILE_NAVS: readonly ReferenceMobileNavSpec[] = [
  {
    id: "api-mobile-navigator",
    hostSelector: "[data-api-mobile-navigator]",
    summarySelector: "[data-api-mobile-navigator] summary",
    label: "API mobile operation navigator",
    required: true,
    routeIds: ["references-api"],
    collapseMechanism: "details-summary",
    defaultOpen: false,
  },
] as const;

/** Sticky / fixed chrome that can obscure hash targets at the viewport top. */
export const REFERENCE_STICKY_CHROME_SELECTOR =
  '[data-docs-header], header[data-sticky], [data-sticky-chrome], [class*="sticky"]' as const;

export type ReferenceHashFocusResult = {
  ok: boolean;
  anchor: string;
  focused: boolean;
  contentUnchanged: boolean;
  activeMatchesTarget: boolean;
  error: string | null;
};

export type ReferenceStickyVisibilityProbe = {
  targetFound: boolean;
  stickyChromeCount: number;
  stickyBottomPx: number;
  targetTopPx: number;
  targetBottomPx: number;
  fullyObscured: boolean;
  hasScrollMargin: boolean;
};

export type ReferenceMobileNavProbe = {
  id: string;
  found: boolean;
  isDetails: boolean;
  defaultOpen: boolean;
  opened: boolean;
  closed: boolean;
  summaryFocusable: boolean;
  focusReturnedToSummary: boolean;
};

export function listReferenceHashTargetsForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceHashTargetSpec[] {
  return REFERENCE_HASH_TARGETS.filter((entry) =>
    entry.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceHashTargets(
  routeId: ReferenceSurfaceRouteId,
): ReferenceHashTargetSpec[] {
  return listReferenceHashTargetsForRoute(routeId).filter(
    (entry) => entry.required,
  );
}

export function listReferenceMobileNavsForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceMobileNavSpec[] {
  return REFERENCE_MOBILE_NAVS.filter((entry) =>
    entry.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceMobileNavs(
  routeId: ReferenceSurfaceRouteId,
): ReferenceMobileNavSpec[] {
  return listReferenceMobileNavsForRoute(routeId).filter(
    (entry) => entry.required,
  );
}

function readHashAnchor(hashOrAnchor: string): string {
  return hashOrAnchor.replace(/^#/, "").trim();
}

function resolveHashTarget(
  root: ParentNode,
  anchor: string,
): HTMLElement | null {
  const trimmed = readHashAnchor(anchor);
  if (trimmed.length === 0) {
    return null;
  }

  if ("getElementById" in root && typeof root.getElementById === "function") {
    const byId = root.getElementById(trimmed);
    if (byId instanceof HTMLElement) {
      return byId;
    }
  }

  const escaped =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(trimmed)
      : trimmed.replace(/"/g, '\\"');
  const byQuery = root.querySelector(`#${escaped}`);
  return byQuery instanceof HTMLElement ? byQuery : null;
}

/**
 * True when a className or computed scroll-margin indicates sticky clearance
 * for hash targets (for example Tailwind `scroll-mt-20`).
 */
export function hasReferenceHashScrollMargin(
  element: Element,
  computedScrollMarginTopPx?: number,
): boolean {
  if (
    typeof computedScrollMarginTopPx === "number" &&
    Number.isFinite(computedScrollMarginTopPx) &&
    computedScrollMarginTopPx > 0
  ) {
    return true;
  }
  const className =
    element instanceof HTMLElement
      ? element.className
      : String(element.className ?? "");
  return /\bscroll-mt-|\bscroll-margin/.test(className);
}

/**
 * Focus + scroll a hash target without rewriting its contract HTML.
 * Mirrors production API / events hash helpers without importing components.
 */
export function focusReferenceHashTarget(
  root: ParentNode,
  hashOrAnchor: string,
  options?: { reduceMotion?: boolean; scroll?: boolean },
): ReferenceHashFocusResult {
  const anchor = readHashAnchor(hashOrAnchor);
  if (anchor.length === 0) {
    return {
      ok: false,
      anchor,
      focused: false,
      contentUnchanged: true,
      activeMatchesTarget: false,
      error: "empty hash anchor",
    };
  }

  const target = resolveHashTarget(root, anchor);
  if (!(target instanceof HTMLElement)) {
    return {
      ok: false,
      anchor,
      focused: false,
      contentUnchanged: true,
      activeMatchesTarget: false,
      error: `hash target "#${anchor}" was not found`,
    };
  }

  const before = target.innerHTML;
  if (!target.hasAttribute("tabindex")) {
    target.tabIndex = -1;
  }

  if (options?.scroll !== false) {
    const reduceMotion = options?.reduceMotion ?? false;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }
  target.focus({ preventScroll: true });

  const contentUnchanged = target.innerHTML === before;
  const activeMatchesTarget =
    typeof document !== "undefined" && document.activeElement === target;

  return {
    ok: contentUnchanged && activeMatchesTarget,
    anchor,
    focused: activeMatchesTarget,
    contentUnchanged,
    activeMatchesTarget,
    error: !contentUnchanged
      ? "hash focus rewrote target content"
      : !activeMatchesTarget
        ? "hash focus did not move document.activeElement to the target"
        : null,
  };
}

type RectLike = {
  top: number;
  bottom: number;
  height: number;
  left: number;
  right: number;
  width: number;
};

function readRect(element: Element): RectLike | null {
  if (typeof (element as Element).getBoundingClientRect !== "function") {
    return null;
  }
  const rect = (element as Element).getBoundingClientRect();
  return {
    top: rect.top,
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    width: rect.width,
  };
}

function isStickyOrFixedPosition(position: string): boolean {
  return position === "sticky" || position === "fixed";
}

/**
 * Collects sticky/fixed chrome that overlaps the top of the viewport and can
 * cover hash targets after scrollIntoView({ block: "start" }).
 */
export function collectStickyChromeRects(
  root: ParentNode,
  options?: {
    selector?: string;
    getComputedStyle?: (element: Element) => { position: string };
  },
): Array<{ element: Element; rect: RectLike }> {
  const selector = options?.selector ?? REFERENCE_STICKY_CHROME_SELECTOR;
  const styleOf =
    options?.getComputedStyle ??
    ((element: Element) => {
      if (typeof window === "undefined" || !window.getComputedStyle) {
        return { position: "static" };
      }
      return window.getComputedStyle(element);
    });

  const hits = Array.from(root.querySelectorAll(selector));
  const results: Array<{ element: Element; rect: RectLike }> = [];

  for (const element of hits) {
    const position = styleOf(element).position;
    if (!isStickyOrFixedPosition(position)) {
      // Class-name sticky candidates may not be active at this viewport;
      // still include elements that expose an explicit sticky data marker.
      const marked =
        element.hasAttribute("data-sticky-chrome") ||
        element.hasAttribute("data-sticky");
      if (!marked) {
        continue;
      }
    }
    const rect = readRect(element);
    if (!rect || rect.height <= 0) {
      continue;
    }
    // Only top-overlapping chrome can obscure a block-start focused target.
    if (rect.top > 8 || rect.bottom <= 0) {
      continue;
    }
    results.push({ element, rect });
  }

  return results;
}

/**
 * True when the focused target is completely covered by sticky/fixed chrome
 * (its bottom edge sits at or above the sticky stack bottom).
 */
export function isHashTargetFullyObscuredBySticky(
  target: Element,
  stickyRects: ReadonlyArray<RectLike>,
): boolean {
  const targetRect = readRect(target);
  if (!targetRect || targetRect.height <= 0) {
    return false;
  }
  if (stickyRects.length === 0) {
    return false;
  }
  const stickyBottom = Math.max(...stickyRects.map((rect) => rect.bottom));
  return targetRect.bottom <= stickyBottom + 0.5;
}

/**
 * Probe sticky visibility for a hash target. When no sticky chrome is present,
 * the target is not considered obscured (scroll-margin still checked when
 * required by the route contract).
 */
export function probeReferenceStickyVisibility(
  root: ParentNode,
  target: Element,
  options?: {
    stickySelector?: string;
    getComputedStyle?: (element: Element) => {
      position: string;
      scrollMarginTop: string;
    };
  },
): ReferenceStickyVisibilityProbe {
  const styleOf =
    options?.getComputedStyle ??
    ((element: Element) => {
      if (typeof window === "undefined" || !window.getComputedStyle) {
        return { position: "static", scrollMarginTop: "0px" };
      }
      return window.getComputedStyle(element);
    });

  const sticky = collectStickyChromeRects(root, {
    selector: options?.stickySelector,
    getComputedStyle: (element) => ({ position: styleOf(element).position }),
  });
  const targetRect = readRect(target) ?? {
    top: 0,
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    width: 0,
  };
  const stickyBottomPx =
    sticky.length === 0
      ? 0
      : Math.max(...sticky.map((entry) => entry.rect.bottom));
  const scrollMarginTop = Number.parseFloat(styleOf(target).scrollMarginTop);
  const hasScrollMargin = hasReferenceHashScrollMargin(
    target,
    Number.isFinite(scrollMarginTop) ? scrollMarginTop : undefined,
  );

  return {
    targetFound: true,
    stickyChromeCount: sticky.length,
    stickyBottomPx,
    targetTopPx: targetRect.top,
    targetBottomPx: targetRect.bottom,
    fullyObscured: isHashTargetFullyObscuredBySticky(
      target,
      sticky.map((entry) => entry.rect),
    ),
    hasScrollMargin,
  };
}

/**
 * Open / close a details-summary mobile navigator and confirm the summary
 * remains keyboard-focusable with focus returning after close.
 */
export function probeReferenceMobileNav(
  root: ParentNode,
  spec: ReferenceMobileNavSpec,
): ReferenceMobileNavProbe {
  const host = root.querySelector(spec.hostSelector);
  const summary = root.querySelector(spec.summarySelector);

  if (
    !(host instanceof HTMLDetailsElement) ||
    !(summary instanceof HTMLElement)
  ) {
    return {
      id: spec.id,
      found: false,
      isDetails: host instanceof HTMLDetailsElement,
      defaultOpen: false,
      opened: false,
      closed: false,
      summaryFocusable: false,
      focusReturnedToSummary: false,
    };
  }

  const defaultOpen = host.open;
  summary.focus();
  const summaryFocusable =
    typeof document !== "undefined" && document.activeElement === summary;

  host.open = true;
  const opened = host.open === true;

  host.open = false;
  const closed = host.open === false;
  summary.focus();
  const focusReturnedToSummary =
    typeof document !== "undefined" && document.activeElement === summary;

  // Restore the probed default for fixtures that expect collapsed chrome.
  host.open = defaultOpen;

  return {
    id: spec.id,
    found: true,
    isDetails: true,
    defaultOpen,
    opened,
    closed,
    summaryFocusable,
    focusReturnedToSummary,
  };
}

/**
 * Assert hash focus for a representative route: focus lands on the target,
 * content is unchanged, scroll-margin is present when required, and sticky
 * chrome does not fully obscure the target.
 */
export function expectReferenceHashFocus(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
  options?: {
    reduceMotion?: boolean;
    scroll?: boolean;
    getComputedStyle?: (element: Element) => {
      position: string;
      scrollMarginTop: string;
    };
  },
): Array<{
  spec: ReferenceHashTargetSpec;
  focus: ReferenceHashFocusResult;
  sticky: ReferenceStickyVisibilityProbe | null;
}> {
  const route = REFERENCE_SURFACE_ROUTES.find((entry) => entry.id === routeId);
  const routeLabel = route?.path ?? routeId;
  const results: Array<{
    spec: ReferenceHashTargetSpec;
    focus: ReferenceHashFocusResult;
    sticky: ReferenceStickyVisibilityProbe | null;
  }> = [];

  for (const spec of listReferenceHashTargetsForRoute(routeId)) {
    const target = root.querySelector(spec.selector);
    if (!(target instanceof HTMLElement)) {
      if (spec.required) {
        throw new Error(
          `${routeLabel}: required hash target "${spec.label}" (${spec.selector}) was not found`,
        );
      }
      results.push({
        spec,
        focus: {
          ok: false,
          anchor: "",
          focused: false,
          contentUnchanged: true,
          activeMatchesTarget: false,
          error: "missing",
        },
        sticky: null,
      });
      continue;
    }

    const anchor = target.id;
    if (!anchor) {
      throw new Error(
        `${routeLabel}: hash target "${spec.label}" (${spec.selector}) is missing a stable id`,
      );
    }

    const focus = focusReferenceHashTarget(root, anchor, {
      reduceMotion: options?.reduceMotion ?? true,
      scroll: options?.scroll,
    });
    if (!focus.ok) {
      throw new Error(
        `${routeLabel}: ${focus.error ?? `hash focus failed for "#${anchor}"`}`,
      );
    }

    const sticky = probeReferenceStickyVisibility(root, target, {
      getComputedStyle: options?.getComputedStyle,
    });
    if (sticky.fullyObscured) {
      throw new Error(
        `${routeLabel}: hash target "${spec.label}" (#${anchor}) is fully obscured by sticky chrome (stickyBottom=${sticky.stickyBottomPx}px, targetBottom=${sticky.targetBottomPx}px)`,
      );
    }
    if (spec.requireScrollMargin && !sticky.hasScrollMargin) {
      throw new Error(
        `${routeLabel}: hash target "${spec.label}" (#${anchor}) is missing scroll-margin / scroll-mt clearance for sticky chrome`,
      );
    }

    results.push({ spec, focus, sticky });
  }

  return results;
}

/**
 * Assert mobile reference navigation opens, closes, and returns focus without
 * a pointer-only dead end.
 */
export function expectReferenceMobileNav(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceMobileNavProbe[] {
  const route = REFERENCE_SURFACE_ROUTES.find((entry) => entry.id === routeId);
  const routeLabel = route?.path ?? routeId;
  const probes = listReferenceMobileNavsForRoute(routeId).map((spec) =>
    probeReferenceMobileNav(root, spec),
  );

  for (const probe of probes) {
    const spec = REFERENCE_MOBILE_NAVS.find((entry) => entry.id === probe.id);
    if (!spec?.required) {
      continue;
    }
    if (!probe.found) {
      throw new Error(
        `${routeLabel}: required mobile navigator "${spec.label}" (${spec.hostSelector}) was not found`,
      );
    }
    if (!probe.isDetails) {
      throw new Error(
        `${routeLabel}: mobile navigator "${spec.label}" must use details-summary collapse`,
      );
    }
    if (probe.defaultOpen !== spec.defaultOpen) {
      throw new Error(
        `${routeLabel}: mobile navigator "${spec.label}" defaultOpen should be ${String(spec.defaultOpen)}`,
      );
    }
    if (!probe.summaryFocusable) {
      throw new Error(
        `${routeLabel}: mobile navigator "${spec.label}" summary is not keyboard focusable`,
      );
    }
    if (!probe.opened || !probe.closed) {
      throw new Error(
        `${routeLabel}: mobile navigator "${spec.label}" did not open and close predictably`,
      );
    }
    if (!probe.focusReturnedToSummary) {
      throw new Error(
        `${routeLabel}: mobile navigator "${spec.label}" did not return focus to the summary after close`,
      );
    }
  }

  return probes;
}

/**
 * Combined hash-focus + mobile-collapse gate for a representative route.
 */
export function expectReferenceHashFocusAndMobileCollapse(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
  options?: Parameters<typeof expectReferenceHashFocus>[2],
): {
  hash: ReturnType<typeof expectReferenceHashFocus>;
  mobile: ReferenceMobileNavProbe[];
} {
  return {
    hash: expectReferenceHashFocus(root, routeId, options),
    mobile: expectReferenceMobileNav(root, routeId),
  };
}
