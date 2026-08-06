"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Reduced-motion-gated, lazily-loaded GSAP.
 *
 * Two constraints shape this module, and both are load-bearing:
 *
 * 1. **GSAP must never run under `prefers-reduced-motion: reduce`.** The global
 *    kill switch in `globals.css` zeroes CSS `animation-duration` /
 *    `transition-duration`, but it cannot touch GSAP — GSAP drives inline
 *    transforms from its own `requestAnimationFrame` ticker, which no media
 *    query can stop. The JS gate here is the only defense, and
 *    `production-home-landing-a11y.test.tsx` asserts
 *    `expect(rafSpy).not.toHaveBeenCalled()` across the whole landing render to
 *    prove it.
 *
 * 2. **GSAP must not load at all when it will not be used.** Importing the
 *    module instantiates its ticker, which schedules a frame. So the import is
 *    dynamic and happens *after* the reduced-motion check passes — that also
 *    keeps ~70KB out of the initial bundle and out of the no-JS static HTML.
 *
 * Every landing animation goes through this hook: one gate, one lazy chunk.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Subset of the GSAP surface landing animations use. */
export type GsapApi = typeof import("gsap").gsap;

export type GsapMotionContext = {
  gsap: GsapApi;
  /** Registers a cleanup to run when the effect tears down. */
  onCleanup: (dispose: () => void) => void;
};

/**
 * Loads GSAP with ScrollTrigger registered.
 *
 * Both modules are pulled in the same dynamic import so scroll-linked and
 * time-based animations share one lazy chunk. Never call this without first
 * checking {@link prefersReducedMotion} — importing GSAP starts its ticker.
 */
async function loadGsap(): Promise<GsapApi> {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  gsap.registerPlugin(ScrollTrigger);
  return gsap;
}

export type UseGsapMotionOptions = {
  /**
   * Extra values that should re-run the animation setup when they change.
   * Kept explicit so callers do not smuggle unstable identities into the hook.
   */
  deps?: readonly unknown[];
  /** Skip setup entirely (for example, before content has mounted). */
  enabled?: boolean;
};

/** True when the user has asked for reduced motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * True when the environment can actually express CSS transforms.
 *
 * GSAP's CSSPlugin reads `getComputedStyle(el).transform` and parses the matrix
 * out of it. Real browsers return `"none"` or a `matrix(...)`; the happy-dom
 * environment unit tests run in returns `""`, which makes GSAP throw on the
 * first tween. Detecting the capability keeps animation to environments that
 * can render it, instead of failing inside a library call.
 */
export function supportsGsapTransforms(): boolean {
  if (typeof window === "undefined" || !window.getComputedStyle) {
    return false;
  }
  try {
    return window.getComputedStyle(document.documentElement).transform !== "";
  } catch {
    return false;
  }
}

/**
 * Live consumers of the shared GSAP ticker.
 *
 * The ticker is a module-level singleton that keeps calling
 * `requestAnimationFrame` for as long as it is awake — including after every
 * animated component has unmounted. Refcounting lets the last consumer put it
 * back to sleep, which stops a real background-work leak and keeps rAF
 * assertions in other suites honest.
 */
let gsapConsumerCount = 0;

/**
 * Tracks the reduced-motion preference reactively.
 *
 * Starts `true` so the very first client render matches the server's
 * no-animation HTML and no animation is ever set up before the preference is
 * known.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  return reduced;
}

/**
 * Runs `setup` with a lazily-imported GSAP instance, but only when motion is
 * allowed. Under reduced motion GSAP is never imported and `setup` never runs,
 * so no frame is ever scheduled.
 *
 * `setup` receives the scope element and a context whose `onCleanup` collects
 * teardown work. Everything is reverted on unmount or when the preference flips
 * to reduce.
 */
export function useGsapMotion<T extends HTMLElement>(
  scope: RefObject<T | null>,
  setup: (element: T, context: GsapMotionContext) => void,
  options: UseGsapMotionOptions = {},
): { reduced: boolean } {
  const { deps = [], enabled = true } = options;
  const reduced = useReducedMotion();
  const setupRef = useRef(setup);

  useEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  useEffect(() => {
    if (reduced || !enabled || !supportsGsapTransforms()) {
      return;
    }
    const element = scope.current;
    if (!element) {
      return;
    }

    let cancelled = false;
    const disposers: Array<() => void> = [];

    // Dynamic import: loading gsap starts its ticker, so it must not happen on
    // the reduced-motion path above.
    loadGsap()
      .then((gsap) => {
        if (cancelled) {
          return;
        }
        gsapConsumerCount += 1;
        const context = gsap.context(() => {
          setupRef.current(element, {
            gsap,
            onCleanup: (dispose) => disposers.push(dispose),
          });
        }, element);

        disposers.push(() => {
          context.revert();
          gsapConsumerCount -= 1;
          if (gsapConsumerCount <= 0) {
            gsapConsumerCount = 0;
            // Last one out stops the ticker so it does not keep requesting
            // frames for a page that no longer has any animation on it.
            gsap.ticker.sleep();
          }
        });
      })
      .catch(() => {
        // Motion is decorative. A failed chunk load must leave the page in its
        // static resting state rather than surfacing an error.
      });

    return () => {
      cancelled = true;
      while (disposers.length > 0) {
        disposers.pop()?.();
      }
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: caller-declared deps intentionally extend this effect
  }, [reduced, enabled, scope, ...deps]);

  return { reduced };
}
