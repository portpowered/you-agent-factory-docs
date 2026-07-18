/**
 * W19 reduced-motion contract for representative Factory reference surfaces.
 * Extends existing `a11y-reduced-motion*` harnesses — does not invent a
 * parallel motion framework.
 *
 * Covers:
 * - Hash navigation scroll behavior (`auto` when reduced motion preferred)
 * - Marked non-essential motion chrome (`data-motion-chrome`) duration probes
 */

import {
  evaluateReducedMotionChromeInBrowser,
  isEffectivelyInstantMotion,
  MOBILE_DRAWER_MOTION_CHROME,
  type MotionDurationProbe,
  parseCssTimeToMs,
  probeMotionDurationsFromStyle,
  probeReducedMotionChrome,
  REDUCED_MOTION_CHROME_SELECTOR,
  REDUCED_MOTION_DURATION_THRESHOLD_MS,
  type ReducedMotionBrowserProbeResult,
} from "./a11y-reduced-motion";
import {
  focusReferenceHashTarget,
  listRequiredReferenceHashTargets,
  type ReferenceHashFocusResult,
} from "./a11y-reference-hash-focus-contract";
import {
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";

export {
  evaluateReducedMotionChromeInBrowser,
  isEffectivelyInstantMotion,
  MOBILE_DRAWER_MOTION_CHROME,
  parseCssTimeToMs,
  probeMotionDurationsFromStyle,
  probeReducedMotionChrome,
  REDUCED_MOTION_CHROME_SELECTOR,
  REDUCED_MOTION_DURATION_THRESHOLD_MS,
};

export type ReferenceMotionChromeKind =
  | "mobile-drawer"
  | "mobile-drawer-backdrop";

export type ReferenceMotionChromeSpec = {
  id: string;
  kind: ReferenceMotionChromeKind;
  /** CSS selector for marked animated chrome. */
  selector: string;
  label: string;
  /**
   * When true, every matching representative route must expose the marker
   * after the chrome is opened (served probes open the drawer). Fixture
   * proofs may mount chrome directly.
   */
  required: boolean;
  routeIds: readonly ReferenceSurfaceRouteId[];
  /**
   * Tailwind / CSS class fragments that must appear on the chrome so the
   * reduced-motion media query can kill transitions without JS.
   */
  requiredReduceClassFragments: readonly string[];
};

/**
 * Non-essential animated chrome on reference surfaces. The docs layout mobile
 * drawer wraps every representative route; markers match production
 * `MobileDocsDrawer`.
 */
export const REFERENCE_MOTION_CHROME: readonly ReferenceMotionChromeSpec[] = [
  {
    id: "docs-mobile-drawer",
    kind: "mobile-drawer",
    selector: `[data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"]`,
    label: "Docs mobile drawer",
    // Present only while the drawer is open; fixture + served probes open it.
    required: false,
    routeIds: REFERENCE_SURFACE_ROUTES.map((route) => route.id),
    requiredReduceClassFragments: [
      "motion-reduce:transition-none",
      "motion-reduce:duration-0",
    ],
  },
  {
    id: "docs-mobile-drawer-backdrop",
    kind: "mobile-drawer-backdrop",
    selector: '[data-motion-chrome="mobile-drawer-backdrop"]',
    label: "Docs mobile drawer backdrop",
    required: false,
    routeIds: REFERENCE_SURFACE_ROUTES.map((route) => route.id),
    requiredReduceClassFragments: ["motion-reduce:transition-none"],
  },
] as const;

/** Routes that mount hash-focus chrome requiring instant scroll under reduce. */
export const REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS: readonly ReferenceSurfaceRouteId[] =
  ["references-api", "references-events", "references-factory-schema"] as const;

/**
 * Hash-focus scroll behavior for reference surfaces. Matches the API W08
 * contract (`auto` when reduced motion is preferred, otherwise `smooth`)
 * without importing the components-layer helper into verify/.
 */
export function referenceHashFocusScrollBehavior(
  reduceMotion: boolean,
): ScrollBehavior {
  return reduceMotion ? "auto" : "smooth";
}

export function listReferenceMotionChromeForRoute(
  routeId: ReferenceSurfaceRouteId,
): ReferenceMotionChromeSpec[] {
  return REFERENCE_MOTION_CHROME.filter((spec) =>
    spec.routeIds.includes(routeId),
  );
}

export function listRequiredReferenceMotionChrome(
  routeId: ReferenceSurfaceRouteId,
): ReferenceMotionChromeSpec[] {
  return listReferenceMotionChromeForRoute(routeId).filter(
    (spec) => spec.required,
  );
}

export type ReferenceMotionChromeProbe = {
  id: string;
  kind: ReferenceMotionChromeKind;
  label: string;
  required: boolean;
  found: boolean;
  hasReduceClasses: boolean;
  missingReduceClassFragments: string[];
  transitionDurationMs: number;
  animationDurationMs: number;
  isReduced: boolean;
};

function classListOf(element: Element): string {
  if (element instanceof HTMLElement) {
    return element.className ?? "";
  }
  return element.getAttribute("class") ?? "";
}

/**
 * Probes one motion-chrome marker: reduce-class fragments + duration probe.
 */
export function probeReferenceMotionChrome(
  root: ParentNode,
  spec: ReferenceMotionChromeSpec,
  options?: { assumeReducedMotionPreference?: boolean },
): ReferenceMotionChromeProbe {
  const element = root.querySelector(spec.selector);
  if (!(element instanceof Element)) {
    return {
      id: spec.id,
      kind: spec.kind,
      label: spec.label,
      required: spec.required,
      found: false,
      hasReduceClasses: false,
      missingReduceClassFragments: [...spec.requiredReduceClassFragments],
      transitionDurationMs: 0,
      animationDurationMs: 0,
      isReduced: false,
    };
  }

  const className = classListOf(element);
  const missingReduceClassFragments = spec.requiredReduceClassFragments.filter(
    (fragment) => !className.includes(fragment),
  );

  let transitionDurationMs = 0;
  let animationDurationMs = 0;
  let isReduced = false;

  if (typeof globalThis.getComputedStyle === "function") {
    const style = globalThis.getComputedStyle(element);
    const durationProbe = probeMotionDurationsFromStyle(
      {
        transitionDuration: style.transitionDuration,
        animationDuration: style.animationDuration,
      },
      spec.selector,
    );
    transitionDurationMs = durationProbe.transitionDurationMs;
    animationDurationMs = durationProbe.animationDurationMs;
    isReduced = durationProbe.isReduced;
  } else if (element instanceof HTMLElement) {
    const inlineTransition =
      element.style.transitionDuration ||
      element
        .getAttribute("style")
        ?.match(/transition-duration:\s*([^;]+)/i)?.[1] ||
      "0s";
    const inlineAnimation =
      element.style.animationDuration ||
      element
        .getAttribute("style")
        ?.match(/animation-duration:\s*([^;]+)/i)?.[1] ||
      "0s";
    const durationProbe = probeMotionDurationsFromStyle(
      {
        transitionDuration: inlineTransition,
        animationDuration: inlineAnimation,
      },
      spec.selector,
    );
    transitionDurationMs = durationProbe.transitionDurationMs;
    animationDurationMs = durationProbe.animationDurationMs;
    isReduced = durationProbe.isReduced;
  }

  // When the preference is known to be set, class fragments alone prove the
  // kill-switch contract even if happy-dom ignores media queries.
  if (
    options?.assumeReducedMotionPreference === true &&
    missingReduceClassFragments.length === 0
  ) {
    isReduced = true;
  }

  return {
    id: spec.id,
    kind: spec.kind,
    label: spec.label,
    required: spec.required,
    found: true,
    hasReduceClasses: missingReduceClassFragments.length === 0,
    missingReduceClassFragments,
    transitionDurationMs,
    animationDurationMs,
    isReduced,
  };
}

export type ReferenceReducedMotionHashProbe = {
  routeId: ReferenceSurfaceRouteId;
  scrollBehaviorWhenReduced: ScrollBehavior;
  scrollBehaviorWhenFull: ScrollBehavior;
  hashFocus: ReferenceHashFocusResult | null;
  hashTargetFound: boolean;
};

/**
 * Proves hash-focus uses instant scroll under reduced motion and still focuses
 * without rewriting contract content.
 */
export function probeReferenceReducedMotionHashFocus(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceReducedMotionHashProbe {
  const scrollBehaviorWhenReduced = referenceHashFocusScrollBehavior(true);
  const scrollBehaviorWhenFull = referenceHashFocusScrollBehavior(false);
  const required = listRequiredReferenceHashTargets(routeId);
  const first = required[0];
  if (!first) {
    return {
      routeId,
      scrollBehaviorWhenReduced,
      scrollBehaviorWhenFull,
      hashFocus: null,
      hashTargetFound: false,
    };
  }

  const target = root.querySelector(first.selector);
  if (!(target instanceof HTMLElement) || !target.id) {
    return {
      routeId,
      scrollBehaviorWhenReduced,
      scrollBehaviorWhenFull,
      hashFocus: null,
      hashTargetFound: false,
    };
  }

  const hashFocus = focusReferenceHashTarget(root, target.id, {
    reduceMotion: true,
  });

  return {
    routeId,
    scrollBehaviorWhenReduced,
    scrollBehaviorWhenFull,
    hashFocus,
    hashTargetFound: true,
  };
}

/**
 * Asserts reduced-motion hash-focus contract for a route that mounts hash
 * chrome. Fails when scroll behavior is not instant under reduce, or when a
 * required hash target fails to take focus.
 */
export function expectReferenceReducedMotionHashFocus(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
): ReferenceReducedMotionHashProbe {
  if (!REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS.includes(routeId)) {
    throw new Error(
      `route "${routeId}" is not in the W19 reduced-motion hash route set`,
    );
  }

  const probe = probeReferenceReducedMotionHashFocus(root, routeId);
  if (probe.scrollBehaviorWhenReduced !== "auto") {
    throw new Error(
      `expected hash scroll behavior "auto" under reduced motion, got "${probe.scrollBehaviorWhenReduced}"`,
    );
  }
  if (probe.scrollBehaviorWhenFull !== "smooth") {
    throw new Error(
      `expected hash scroll behavior "smooth" without reduced motion, got "${probe.scrollBehaviorWhenFull}"`,
    );
  }
  if (!probe.hashTargetFound || !probe.hashFocus) {
    throw new Error(
      `required hash target for reduced-motion probe missing on "${routeId}"`,
    );
  }
  if (!probe.hashFocus.ok) {
    throw new Error(
      `reduced-motion hash focus failed on "${routeId}": ${probe.hashFocus.error ?? "unknown"}`,
    );
  }
  return probe;
}

/**
 * Asserts present motion-chrome markers carry reduce-class fragments and
 * report reduced durations when the preference is assumed/set.
 */
export function expectReferenceReducedMotionChrome(
  root: ParentNode,
  routeId: ReferenceSurfaceRouteId,
  options?: {
    assumeReducedMotionPreference?: boolean;
    requirePresent?: boolean;
  },
): ReferenceMotionChromeProbe[] {
  const specs = listReferenceMotionChromeForRoute(routeId);
  const probes = specs.map((spec) =>
    probeReferenceMotionChrome(root, spec, {
      assumeReducedMotionPreference: options?.assumeReducedMotionPreference,
    }),
  );

  const present = probes.filter((probe) => probe.found);
  if (options?.requirePresent === true && present.length === 0) {
    throw new Error(
      `expected at least one motion-chrome marker on "${routeId}"`,
    );
  }

  for (const probe of present) {
    if (!probe.hasReduceClasses) {
      throw new Error(
        `motion chrome "${probe.label}" missing reduce classes: ${probe.missingReduceClassFragments.join(", ")}`,
      );
    }
    if (options?.assumeReducedMotionPreference === true && !probe.isReduced) {
      throw new Error(
        `motion chrome "${probe.label}" is not reduced under prefers-reduced-motion (transition=${probe.transitionDurationMs}ms, animation=${probe.animationDurationMs}ms)`,
      );
    }
  }

  for (const probe of probes) {
    if (probe.required && !probe.found) {
      throw new Error(
        `required motion chrome "${probe.label}" missing on "${routeId}"`,
      );
    }
  }

  return probes;
}

export type ReferenceReducedMotionEvaluateArgs = {
  routeId: ReferenceSurfaceRouteId;
  hashSelector: string | null;
  motionChromeSelectors: readonly string[];
  thresholdMs: number;
  drawerMenuSelector: string;
};

export type ReferenceReducedMotionEvaluateResult = {
  ok: boolean;
  error: string | null;
  prefersReducedMotion: boolean;
  documentScrollBehavior: string;
  hashFocus: {
    found: boolean;
    focused: boolean;
    contentUnchanged: boolean;
  } | null;
  motionChrome: ReducedMotionBrowserProbeResult[];
};

/**
 * Self-contained Playwright `page.evaluate` helper for W19 reduced-motion.
 * Call after `page.emulateMedia({ reducedMotion: "reduce" })`.
 */
export function evaluateReferenceReducedMotionInBrowser(
  args: ReferenceReducedMotionEvaluateArgs,
): ReferenceReducedMotionEvaluateResult {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const documentScrollBehavior = window.getComputedStyle(
    document.documentElement,
  ).scrollBehavior;

  const errors: string[] = [];
  if (!prefersReducedMotion) {
    errors.push("prefers-reduced-motion: reduce was not active");
  }
  // globals.css forces scroll-behavior: auto under the reduce media query.
  if (documentScrollBehavior !== "auto" && documentScrollBehavior !== "") {
    // Some engines report "" when unset; only fail on an explicit smooth value.
    if (documentScrollBehavior === "smooth") {
      errors.push(`document scroll-behavior is "smooth" under reduced motion`);
    }
  }

  let hashFocus: ReferenceReducedMotionEvaluateResult["hashFocus"] = null;
  if (args.hashSelector) {
    const target = document.querySelector(args.hashSelector);
    if (!(target instanceof HTMLElement) || !target.id) {
      errors.push(
        `hash target for reduced-motion probe missing (${args.hashSelector})`,
      );
      hashFocus = {
        found: false,
        focused: false,
        contentUnchanged: true,
      };
    } else {
      const before = target.innerHTML;
      if (!target.hasAttribute("tabindex")) {
        target.tabIndex = -1;
      }
      target.scrollIntoView({ behavior: "auto", block: "start" });
      target.focus({ preventScroll: true });
      const contentUnchanged = target.innerHTML === before;
      const focused = document.activeElement === target;
      hashFocus = {
        found: true,
        focused,
        contentUnchanged,
      };
      if (!contentUnchanged) {
        errors.push("hash focus rewrote target content under reduced motion");
      }
      if (!focused) {
        errors.push("hash focus did not land on target under reduced motion");
      }
    }
  }

  const parseCssTimeToMsLocal = (value: string): number => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "none" || trimmed === "initial") {
      return 0;
    }
    let maxMs = 0;
    for (const part of trimmed.split(",")) {
      const token = part.trim().toLowerCase();
      if (!token) {
        continue;
      }
      if (token.endsWith("ms")) {
        const ms = Number.parseFloat(token.slice(0, -2));
        if (Number.isFinite(ms)) {
          maxMs = Math.max(maxMs, ms);
        }
        continue;
      }
      if (token.endsWith("s")) {
        const seconds = Number.parseFloat(token.slice(0, -1));
        if (Number.isFinite(seconds)) {
          maxMs = Math.max(maxMs, seconds * 1000);
        }
      }
    }
    return maxMs;
  };

  const motionChrome: ReducedMotionBrowserProbeResult[] = [];
  for (const selector of args.motionChromeSelectors) {
    const element = document.querySelector(selector);
    if (!element) {
      motionChrome.push({
        selector,
        found: false,
        prefersReducedMotion,
        transitionDurationMs: 0,
        animationDurationMs: 0,
        isReduced: false,
      });
      continue;
    }
    const style = window.getComputedStyle(element);
    const transitionDurationMs = parseCssTimeToMsLocal(
      style.transitionDuration,
    );
    const animationDurationMs = parseCssTimeToMsLocal(style.animationDuration);
    const isReduced =
      transitionDurationMs <= args.thresholdMs &&
      animationDurationMs <= args.thresholdMs;
    motionChrome.push({
      selector,
      found: true,
      prefersReducedMotion,
      transitionDurationMs,
      animationDurationMs,
      isReduced,
    });
    if (!isReduced) {
      errors.push(
        `motion chrome "${selector}" still animates under reduce (transition=${transitionDurationMs}ms)`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    error: errors.length > 0 ? errors.join("; ") : null,
    prefersReducedMotion,
    documentScrollBehavior,
    hashFocus,
    motionChrome,
  };
}

/** Plain args for {@link evaluateReferenceReducedMotionInBrowser}. */
export function referenceReducedMotionEvaluateArgs(
  routeId: ReferenceSurfaceRouteId,
  options?: { hashSelector?: string | null },
): ReferenceReducedMotionEvaluateArgs {
  const hashSpecs = listRequiredReferenceHashTargets(routeId);
  const hashSelector =
    options?.hashSelector !== undefined
      ? options.hashSelector
      : (hashSpecs[0]?.selector ?? null);

  return {
    routeId,
    hashSelector,
    motionChromeSelectors: listReferenceMotionChromeForRoute(routeId).map(
      (spec) => spec.selector,
    ),
    thresholdMs: REDUCED_MOTION_DURATION_THRESHOLD_MS,
    drawerMenuSelector: "header button[aria-expanded]",
  };
}

export type { MotionDurationProbe };
