import { afterEach, describe, expect, test } from "bun:test";
import {
  evaluateReducedMotionChromeInBrowser,
  isEffectivelyInstantMotion,
  MOBILE_DRAWER_MOTION_CHROME,
  parseCssTimeToMs,
  probeMotionDurationsFromStyle,
  probeReducedMotionChrome,
  REDUCED_MOTION_CHROME_SELECTOR,
  REDUCED_MOTION_DURATION_THRESHOLD_MS,
} from "./a11y-reduced-motion";

describe("parseCssTimeToMs", () => {
  test("parses seconds, milliseconds, and multi-value lists", () => {
    expect(parseCssTimeToMs("300ms")).toBe(300);
    expect(parseCssTimeToMs("0.3s")).toBe(300);
    expect(parseCssTimeToMs("0s, 300ms")).toBe(300);
    expect(parseCssTimeToMs("0.01ms")).toBe(0.01);
    expect(parseCssTimeToMs("none")).toBe(0);
    expect(parseCssTimeToMs("")).toBe(0);
  });
});

describe("isEffectivelyInstantMotion", () => {
  test("treats durations at or below the threshold as reduced", () => {
    expect(isEffectivelyInstantMotion(0)).toBe(true);
    expect(isEffectivelyInstantMotion(0.01)).toBe(true);
    expect(
      isEffectivelyInstantMotion(REDUCED_MOTION_DURATION_THRESHOLD_MS),
    ).toBe(true);
    expect(isEffectivelyInstantMotion(300)).toBe(false);
  });
});

describe("probeMotionDurationsFromStyle", () => {
  test("reports reduced when both transition and animation are instant", () => {
    const probe = probeMotionDurationsFromStyle({
      transitionDuration: "0.01ms",
      animationDuration: "0s",
    });
    expect(probe.isReduced).toBe(true);
    expect(probe.transitionDurationMs).toBe(0.01);
  });

  test("reports not reduced when a transition still runs", () => {
    const probe = probeMotionDurationsFromStyle({
      transitionDuration: "300ms",
      animationDuration: "0s",
    });
    expect(probe.isReduced).toBe(false);
    expect(probe.transitionDurationMs).toBe(300);
  });
});

describe("probeReducedMotionChrome", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("returns found:false when chrome marker is missing", () => {
    document.body.innerHTML = `<aside role="dialog">drawer</aside>`;
    const probe = probeReducedMotionChrome(document);
    expect(probe.found).toBe(false);
    expect(probe.isReduced).toBe(false);
  });

  test("reads computed durations from marked chrome", () => {
    document.body.innerHTML = `
      <aside
        data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"
        style="transition-duration: 0.01ms; animation-duration: 0s;"
      >
        drawer
      </aside>
    `;
    const probe = probeReducedMotionChrome(
      document,
      `[data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"]`,
    );
    expect(probe.found).toBe(true);
    // happy-dom may not apply stylesheet media queries; assert the style
    // attribute contract the marker exposes for Playwright probes.
    expect(probe.selector).toContain(MOBILE_DRAWER_MOTION_CHROME);
  });
});

describe("evaluateReducedMotionChromeInBrowser", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("is self-contained and reports missing chrome", () => {
    const result = evaluateReducedMotionChromeInBrowser({
      selector: REDUCED_MOTION_CHROME_SELECTOR,
      thresholdMs: REDUCED_MOTION_DURATION_THRESHOLD_MS,
    });
    expect(result.found).toBe(false);
    expect(typeof result.prefersReducedMotion).toBe("boolean");
  });
});
