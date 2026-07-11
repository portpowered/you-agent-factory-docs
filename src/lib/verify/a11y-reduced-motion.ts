/**
 * Reduced-motion probes for critical-route chrome. Pure helpers stay usable
 * from happy-dom unit tests; the browser evaluator is self-contained for
 * Playwright `page.evaluate`.
 */

/** Marker on animated critical chrome that must honor prefers-reduced-motion. */
export const REDUCED_MOTION_CHROME_SELECTOR = "[data-motion-chrome]" as const;

export const MOBILE_DRAWER_MOTION_CHROME = "mobile-drawer" as const;

/**
 * Durations at or below this threshold count as instantaneous / reduced.
 * Matches the globals.css 0.01ms kill-switch (plus a small float buffer).
 */
export const REDUCED_MOTION_DURATION_THRESHOLD_MS = 50;

/**
 * Parses a CSS time list (`"300ms"`, `"0.3s"`, `"0s, 300ms"`) into the longest
 * duration in milliseconds. Empty / `none`-like values yield 0.
 */
export function parseCssTimeToMs(value: string): number {
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
}

export function isEffectivelyInstantMotion(
  durationMs: number,
  thresholdMs: number = REDUCED_MOTION_DURATION_THRESHOLD_MS,
): boolean {
  return durationMs <= thresholdMs;
}

export type MotionDurationProbe = {
  selector: string;
  found: boolean;
  transitionDurationMs: number;
  animationDurationMs: number;
  isReduced: boolean;
};

type StyleLike = {
  transitionDuration: string;
  animationDuration: string;
};

/**
 * Reads transition/animation durations from a style-like object (computed
 * style or a test double) and reports whether motion is effectively reduced.
 */
export function probeMotionDurationsFromStyle(
  style: StyleLike,
  selector: string = REDUCED_MOTION_CHROME_SELECTOR,
): MotionDurationProbe {
  const transitionDurationMs = parseCssTimeToMs(style.transitionDuration);
  const animationDurationMs = parseCssTimeToMs(style.animationDuration);
  return {
    selector,
    found: true,
    transitionDurationMs,
    animationDurationMs,
    isReduced:
      isEffectivelyInstantMotion(transitionDurationMs) &&
      isEffectivelyInstantMotion(animationDurationMs),
  };
}

/**
 * Probes the first matching reduced-motion chrome element in a document.
 */
export function probeReducedMotionChrome(
  root: ParentNode,
  selector: string = REDUCED_MOTION_CHROME_SELECTOR,
): MotionDurationProbe {
  const element = root.querySelector(selector);
  if (!element) {
    return {
      selector,
      found: false,
      transitionDurationMs: 0,
      animationDurationMs: 0,
      isReduced: false,
    };
  }

  const style = globalThis.getComputedStyle(element as Element);
  return probeMotionDurationsFromStyle(
    {
      transitionDuration: style.transitionDuration,
      animationDuration: style.animationDuration,
    },
    selector,
  );
}

export type ReducedMotionBrowserProbeArgs = {
  selector: string;
  thresholdMs: number;
};

export type ReducedMotionBrowserProbeResult = {
  selector: string;
  found: boolean;
  prefersReducedMotion: boolean;
  transitionDurationMs: number;
  animationDurationMs: number;
  isReduced: boolean;
};

/**
 * Self-contained Playwright `page.evaluate` helper. Do not close over module
 * imports — pass selector + threshold as a single argument object.
 */
export function evaluateReducedMotionChromeInBrowser(
  args: ReducedMotionBrowserProbeArgs,
): ReducedMotionBrowserProbeResult {
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

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const element = document.querySelector(args.selector);
  if (!element) {
    return {
      selector: args.selector,
      found: false,
      prefersReducedMotion,
      transitionDurationMs: 0,
      animationDurationMs: 0,
      isReduced: false,
    };
  }

  const style = window.getComputedStyle(element);
  const transitionDurationMs = parseCssTimeToMsLocal(style.transitionDuration);
  const animationDurationMs = parseCssTimeToMsLocal(style.animationDuration);
  return {
    selector: args.selector,
    found: true,
    prefersReducedMotion,
    transitionDurationMs,
    animationDurationMs,
    isReduced:
      transitionDurationMs <= args.thresholdMs &&
      animationDurationMs <= args.thresholdMs,
  };
}
