/**
 * W19 long-token overflow contract for representative Factory reference
 * surfaces. Extends existing responsive overflow probes — does not invent a
 * parallel overflow framework.
 *
 * Covers long OpenAPI paths, schema field names/paths, enum values, and
 * unbroken code samples at narrow phone + zoomed layouts: tokens must wrap or
 * scroll inside intentional containers without forcing page-level horizontal
 * overflow.
 */

import {
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  PAGE_OVERFLOW_TOLERANCE_PX,
  REFERENCE_SURFACE_ROUTES,
  REFERENCE_SURFACE_VIEWPORTS,
  type ReferenceSurfaceRouteId,
  type ReferenceSurfaceViewport,
} from "./a11y-reference-surface-contract";
import {
  collectResponsiveOverflowProbe,
  type DocumentLike,
  type ResponsiveOverflowProbeResult,
} from "./a11y-responsive-probes";

export type ReferenceLongTokenKind = "path" | "field" | "enum" | "code";

export type ReferenceLongTokenSpec = {
  id: string;
  kind: ReferenceLongTokenKind;
  /** CSS selector for the token element (or its intentional container). */
  selector: string;
  label: string;
  /**
   * When true, every matching representative route must expose at least one
   * contained hit. Optional markers are asserted only when present.
   */
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
};

/**
 * Layouts where long unbroken tokens are most likely to force page overflow.
 * Story 009 focuses on narrow phone + zoomed (~200% of laptop CSS pixels).
 */
export const REFERENCE_LONG_TOKEN_OVERFLOW_VIEWPORT_IDS = [
  "mobile",
  "zoomed",
] as const;

export type ReferenceLongTokenOverflowViewportId =
  (typeof REFERENCE_LONG_TOKEN_OVERFLOW_VIEWPORT_IDS)[number];

export function listReferenceLongTokenOverflowViewports(): ReferenceSurfaceViewport[] {
  return REFERENCE_LONG_TOKEN_OVERFLOW_VIEWPORT_IDS.map((id) => {
    const viewport = REFERENCE_SURFACE_VIEWPORTS.find(
      (entry) => entry.id === id,
    );
    if (!viewport) {
      throw new Error(`Missing reference viewport for long-token probe: ${id}`);
    }
    return viewport;
  });
}

/**
 * Class fragments that prove wrap, truncate, or intentional horizontal scroll
 * containment on a token or an ancestor.
 */
export const REFERENCE_LONG_TOKEN_CONTAINMENT_CLASS_FRAGMENTS = [
  "break-all",
  "break-words",
  "truncate",
  "overflow-auto",
  "overflow-x-auto",
  "overflow-x-scroll",
  "overflow-hidden",
  "overflow-x-hidden",
] as const;

/**
 * Representative long-token surfaces. Selectors prefer production data attrs
 * already used by W08/W09 chrome; authored embeds use embed-local markers.
 */
export const REFERENCE_LONG_TOKENS: readonly ReferenceLongTokenSpec[] = [
  {
    id: "api-operation-path",
    kind: "path",
    // Harness custom chrome uses `h2 code`; Fumadocs-primary wraps the static
    // method/path bar with `data-api-operation-path-token`.
    selector:
      "[data-api-operation-section] h2 code, [data-api-operation-path-token] code",
    label: "API operation path",
    required: true,
    routeIds: ["references-api"],
  },
  {
    id: "event-stream-path",
    kind: "path",
    selector: "[data-event-stream-path] code",
    label: "Event stream path",
    required: true,
    routeIds: ["references-events"],
  },
  {
    id: "schema-field-name",
    kind: "field",
    selector: "[data-schema-field-name]",
    label: "Schema field name",
    required: true,
    routeIds: ["references-factory-schema"],
  },
  {
    id: "schema-field-path",
    kind: "field",
    selector: "[data-schema-field-path-label]",
    label: "Schema field path",
    required: true,
    routeIds: ["references-factory-schema"],
  },
  {
    id: "schema-enum",
    kind: "enum",
    selector: '[data-schema-constraint="enum"] code',
    label: "Schema enum values",
    // Not every definition publishes enums; fixture + served pages assert when present.
    required: false,
    routeIds: ["references-factory-schema"],
  },
  {
    id: "api-example-code",
    kind: "code",
    selector: '[data-api-example="code"]',
    label: "API example code panel",
    required: false,
    routeIds: ["references-api"],
  },
  {
    id: "schema-example-code",
    kind: "code",
    selector: '[data-schema-example="code"]',
    label: "Schema example code panel",
    required: false,
    routeIds: ["references-factory-schema"],
  },
  {
    id: "docs-code-scroll",
    kind: "code",
    selector: '[data-rich-content-scroll="code"], pre.overflow-x-auto, pre',
    label: "Docs / fenced code scroller",
    required: false,
    routeIds: REFERENCE_SURFACE_ROUTES.map((route) => route.id),
  },
  {
    id: "authored-schema-property-name",
    kind: "field",
    selector: "[data-schema-embed-property-name]",
    label: "Authored schema embed property name",
    required: false,
    routeIds: ["authored-factory", "authored-worker", "authored-workstation"],
  },
  {
    id: "authored-schema-enum",
    kind: "enum",
    selector: "[data-schema-embed-enum]",
    label: "Authored schema embed enum values",
    required: false,
    routeIds: ["authored-factory", "authored-worker", "authored-workstation"],
  },
] as const;

export function listReferenceLongTokensForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceLongTokenSpec[] {
  return REFERENCE_LONG_TOKENS.filter((spec) =>
    spec.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceLongTokens(
  routeId: ReferenceSurfaceRouteId,
): ReferenceLongTokenSpec[] {
  return listReferenceLongTokensForRoute(routeId).filter(
    (spec) => spec.required,
  );
}

function classNameOf(element: Element): string {
  return element instanceof HTMLElement ? element.className : "";
}

export function elementHasLongTokenContainmentClass(element: Element): boolean {
  const className = classNameOf(element);
  return REFERENCE_LONG_TOKEN_CONTAINMENT_CLASS_FRAGMENTS.some((fragment) =>
    className.includes(fragment),
  );
}

function matchesIntentionalScroller(element: Element): boolean {
  if (element.tagName.toLowerCase() === "pre") {
    return true;
  }
  for (const selector of INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch {
      // Invalid selector in some DOMs — ignore.
    }
  }
  return elementHasLongTokenContainmentClass(element);
}

/**
 * True when the token wraps/truncates itself, sits inside an intentional
 * horizontal scroller, or owns a descendant intentional scroller (CodePanel).
 */
export function isReferenceLongTokenContained(element: Element): boolean {
  let current: Element | null = element;
  while (current) {
    if (matchesIntentionalScroller(current)) {
      return true;
    }
    current = current.parentElement;
  }

  if (
    element.querySelector(
      'pre, .overflow-x-auto, [data-rich-content-scroll="code"]',
    )
  ) {
    return true;
  }

  return false;
}

export type ReferenceLongTokenProbe = {
  id: string;
  kind: ReferenceLongTokenKind;
  label: string;
  required: boolean;
  found: boolean;
  hitCount: number;
  containedHitCount: number;
  uncontainedHitCount: number;
  allHitsContained: boolean;
};

export function probeReferenceLongToken(
  root: ParentNode,
  spec: ReferenceLongTokenSpec,
): ReferenceLongTokenProbe {
  let hits: Element[] = [];
  try {
    hits = Array.from(root.querySelectorAll(spec.selector));
  } catch {
    hits = [];
  }

  let containedHitCount = 0;
  let uncontainedHitCount = 0;
  for (const hit of hits) {
    if (isReferenceLongTokenContained(hit)) {
      containedHitCount += 1;
    } else {
      uncontainedHitCount += 1;
    }
  }

  return {
    id: spec.id,
    kind: spec.kind,
    label: spec.label,
    required: spec.required,
    found: hits.length > 0,
    hitCount: hits.length,
    containedHitCount,
    uncontainedHitCount,
    allHitsContained: hits.length === 0 ? false : uncontainedHitCount === 0,
  };
}

export function probeReferenceLongTokensForRoute(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceLongTokenProbe[] {
  return listReferenceLongTokensForRoute(routeId).map((spec) =>
    probeReferenceLongToken(root, spec),
  );
}

export type ReferenceLongTokenOverflowProbe = {
  routeId: ReferenceSurfaceRouteId;
  tokens: ReferenceLongTokenProbe[];
  overflow: ResponsiveOverflowProbeResult;
  ok: boolean;
  error: string | null;
};

/**
 * Asserts required long tokens are present and contained, optional tokens are
 * contained when present, and page-level overflow stays within tolerance.
 */
export function expectReferenceLongTokenOverflow(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
  doc: DocumentLike = root as unknown as DocumentLike,
  tolerancePx: number = PAGE_OVERFLOW_TOLERANCE_PX,
): ReferenceLongTokenOverflowProbe {
  const tokens = probeReferenceLongTokensForRoute(root, routeId);
  const overflow = collectResponsiveOverflowProbe(
    doc,
    root,
    INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
    tolerancePx,
  );

  for (const probe of tokens) {
    if (!probe.required) {
      if (probe.found && !probe.allHitsContained) {
        throw new Error(
          `optional long token "${probe.label}" (${probe.id}) overflows outside an intentional container (${probe.uncontainedHitCount} uncontained hit(s))`,
        );
      }
      continue;
    }
    if (!probe.found) {
      throw new Error(
        `required long token "${probe.label}" (${probe.id}) was not found on ${routeId}`,
      );
    }
    if (!probe.allHitsContained) {
      throw new Error(
        `required long token "${probe.label}" (${probe.id}) is not contained (wrap/truncate/scroll) — ${probe.uncontainedHitCount} uncontained hit(s)`,
      );
    }
  }

  if (overflow.page.hasUnintendedOverflow) {
    throw new Error(
      `page-level horizontal overflow of ${overflow.page.overflowPx}px exceeds tolerance ${tolerancePx}px on ${routeId} (long tokens must not expand the document)`,
    );
  }

  return {
    routeId,
    tokens,
    overflow,
    ok: true,
    error: null,
  };
}

/** Plain args for Playwright `page.evaluate` (no Node closures). */
export function referenceLongTokenOverflowEvaluateArgs(
  routeId: ReferenceSurfaceRouteId,
): {
  routeId: ReferenceSurfaceRouteId;
  tolerancePx: number;
  selectors: readonly string[];
  tokens: Array<{
    id: string;
    kind: ReferenceLongTokenKind;
    selector: string;
    label: string;
    required: boolean;
  }>;
  containmentClassFragments: readonly string[];
} {
  return {
    routeId,
    tolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
    selectors: INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
    containmentClassFragments: REFERENCE_LONG_TOKEN_CONTAINMENT_CLASS_FRAGMENTS,
    tokens: listReferenceLongTokensForRoute(routeId).map((spec) => ({
      id: spec.id,
      kind: spec.kind,
      selector: spec.selector,
      label: spec.label,
      required: spec.required,
    })),
  };
}

export type ReferenceLongTokenOverflowEvaluateResult = {
  ok: boolean;
  error: string | null;
  routeId: string;
  pageOverflowPx: number;
  hasUnintendedPageOverflow: boolean;
  tokens: Array<{
    id: string;
    kind: string;
    label: string;
    required: boolean;
    found: boolean;
    hitCount: number;
    containedHitCount: number;
    uncontainedHitCount: number;
    allHitsContained: boolean;
  }>;
};

/**
 * Self-contained browser probe for Playwright `page.evaluate`. Do not close
 * over module imports — Playwright serializes only this function body.
 */
export function evaluateReferenceLongTokenOverflowInBrowser(args: {
  routeId: string;
  tolerancePx: number;
  selectors: readonly string[];
  containmentClassFragments: readonly string[];
  tokens: ReadonlyArray<{
    id: string;
    kind: string;
    selector: string;
    label: string;
    required: boolean;
  }>;
}): ReferenceLongTokenOverflowEvaluateResult {
  const root = document.documentElement;
  const body = document.body;
  const clientWidth = Math.max(root.clientWidth, body?.clientWidth ?? 0);
  const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
  const pageOverflowPx = Math.max(0, scrollWidth - clientWidth);
  const hasUnintendedPageOverflow = pageOverflowPx > args.tolerancePx;

  function hasContainmentClass(element: Element): boolean {
    const className =
      element instanceof HTMLElement
        ? element.className
        : String(element.className ?? "");
    return args.containmentClassFragments.some((fragment) =>
      className.includes(fragment),
    );
  }

  function matchesScroller(element: Element): boolean {
    if (element.tagName.toLowerCase() === "pre") {
      return true;
    }
    for (const selector of args.selectors) {
      try {
        if (element.matches(selector)) {
          return true;
        }
      } catch {
        // ignore
      }
    }
    return hasContainmentClass(element);
  }

  function isContained(element: Element): boolean {
    let current: Element | null = element;
    while (current) {
      if (matchesScroller(current)) {
        return true;
      }
      current = current.parentElement;
    }
    if (
      element.querySelector(
        'pre, .overflow-x-auto, [data-rich-content-scroll="code"]',
      )
    ) {
      return true;
    }
    return false;
  }

  const tokens = args.tokens.map((spec) => {
    let hits: Element[] = [];
    try {
      hits = Array.from(document.querySelectorAll(spec.selector));
    } catch {
      hits = [];
    }
    let containedHitCount = 0;
    let uncontainedHitCount = 0;
    for (const hit of hits) {
      if (isContained(hit)) {
        containedHitCount += 1;
      } else {
        uncontainedHitCount += 1;
      }
    }
    return {
      id: spec.id,
      kind: spec.kind,
      label: spec.label,
      required: spec.required,
      found: hits.length > 0,
      hitCount: hits.length,
      containedHitCount,
      uncontainedHitCount,
      allHitsContained: hits.length === 0 ? false : uncontainedHitCount === 0,
    };
  });

  for (const probe of tokens) {
    if (!probe.required) {
      if (probe.found && !probe.allHitsContained) {
        return {
          ok: false,
          error: `optional long token "${probe.label}" (${probe.id}) overflows outside an intentional container`,
          routeId: args.routeId,
          pageOverflowPx,
          hasUnintendedPageOverflow,
          tokens,
        };
      }
      continue;
    }
    if (!probe.found) {
      return {
        ok: false,
        error: `required long token "${probe.label}" (${probe.id}) was not found`,
        routeId: args.routeId,
        pageOverflowPx,
        hasUnintendedPageOverflow,
        tokens,
      };
    }
    if (!probe.allHitsContained) {
      return {
        ok: false,
        error: `required long token "${probe.label}" (${probe.id}) is not contained`,
        routeId: args.routeId,
        pageOverflowPx,
        hasUnintendedPageOverflow,
        tokens,
      };
    }
  }

  if (hasUnintendedPageOverflow) {
    return {
      ok: false,
      error: `page-level horizontal overflow of ${pageOverflowPx}px exceeds tolerance`,
      routeId: args.routeId,
      pageOverflowPx,
      hasUnintendedPageOverflow,
      tokens,
    };
  }

  return {
    ok: true,
    error: null,
    routeId: args.routeId,
    pageOverflowPx,
    hasUnintendedPageOverflow,
    tokens,
  };
}
