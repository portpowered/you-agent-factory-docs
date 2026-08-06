import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { useRef } from "react";

/**
 * Stub GSAP rather than loading the real module.
 *
 * The real GSAP ticker is a process-wide singleton that starts requesting
 * animation frames the moment it loads, and those frames leak into unrelated
 * suites that assert `requestAnimationFrame` was never called (ParticleSphere,
 * the production landing a11y contract). Stubbing keeps this file hermetic and
 * still exercises the gate, which is the whole contract under test.
 */
mock.module("gsap", () => ({
  gsap: {
    registerPlugin: () => {},
    context: (fn: () => void) => {
      fn();
      return { revert: () => {} };
    },
    ticker: { sleep: () => {} },
  },
}));
mock.module("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));

import {
  prefersReducedMotion,
  supportsGsapTransforms,
  useGsapMotion,
} from "./use-gsap-motion";

function mockPrefersReducedMotion(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

/** happy-dom reports `transform: ""`; a real browser reports `"none"`. */
function mockTransformSupport(supported: boolean) {
  Object.defineProperty(window, "getComputedStyle", {
    configurable: true,
    value: () => ({ transform: supported ? "none" : "" }),
  });
}

const originalMatchMedia = window.matchMedia;
const originalGetComputedStyle = window.getComputedStyle;

function Probe({ onSetup }: { onSetup: () => void }) {
  const scope = useRef<HTMLDivElement>(null);
  useGsapMotion(scope, () => {
    onSetup();
  });
  return <div data-testid="scope" ref={scope} />;
}

describe("useGsapMotion", () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(window, "getComputedStyle", {
      configurable: true,
      value: originalGetComputedStyle,
    });
  });

  test("never schedules a frame or runs setup under reduced motion", async () => {
    mockPrefersReducedMotion(true);
    mockTransformSupport(true);
    const rafSpy = spyOn(window, "requestAnimationFrame").mockImplementation(
      () => 1,
    );
    let setupCalls = 0;

    await act(async () => {
      render(<Probe onSetup={() => setupCalls++} />);
    });

    expect(setupCalls).toBe(0);
    expect(rafSpy).not.toHaveBeenCalled();
    rafSpy.mockRestore();
  });

  test("skips setup when the environment cannot express transforms", async () => {
    mockPrefersReducedMotion(false);
    mockTransformSupport(false);
    let setupCalls = 0;

    await act(async () => {
      render(<Probe onSetup={() => setupCalls++} />);
    });

    expect(setupCalls).toBe(0);
  });

  test("runs setup when motion is allowed and transforms are supported", async () => {
    mockPrefersReducedMotion(false);
    mockTransformSupport(true);
    let setupCalls = 0;

    await act(async () => {
      render(<Probe onSetup={() => setupCalls++} />);
    });

    await waitFor(() => {
      expect(setupCalls).toBe(1);
    });
  });

  test("prefersReducedMotion fails closed when matchMedia is unavailable", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });
    expect(prefersReducedMotion()).toBe(true);
  });

  test("supportsGsapTransforms is false in the happy-dom unit environment", () => {
    expect(supportsGsapTransforms()).toBe(false);
  });
});
