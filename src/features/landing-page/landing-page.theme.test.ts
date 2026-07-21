import { describe, expect, test } from "bun:test";
import {
  landingPageTheme,
  landingThemeToCssVars,
} from "@/features/landing-page/landing-page.theme";

describe("landing-page.theme", () => {
  test("exports whale knobs aligned with motion-whale defaults", () => {
    expect(landingPageTheme.whale.initialScale).toBe(0.78);
    expect(landingPageTheme.whale.initialY).toBe(48);
    expect(landingPageTheme.whale.durationMs).toBe(1600);
    expect(landingPageTheme.whale.ease).toEqual([0.16, 0.84, 0.22, 1]);
    expect(landingPageTheme.whale.blurPx).toBe(6);
    expect(landingPageTheme.whale.viewAmount).toBe(0.3);
    expect(landingPageTheme.whale.bubbleDelayMs).toBe(280);
    expect(landingPageTheme.whale.parallaxFactor).toBe(0.4);
  });

  test("exports carousel and sphere stub knobs", () => {
    expect(landingPageTheme.carousel.activeScale).toBe(1);
    expect(landingPageTheme.carousel.neighborScale).toBeLessThan(1);
    expect(landingPageTheme.carousel.neighborOpacity).toBeGreaterThan(0);
    expect(landingPageTheme.carousel.transitionMs).toBeGreaterThan(0);
    expect(landingPageTheme.sphere.particleCount).toBeGreaterThan(0);
    expect(landingPageTheme.sphere.repulsion).toBeGreaterThan(0);
    expect(landingPageTheme.sphere.radiusRatio).toBeGreaterThan(0);
  });

  test("maps theme knobs to --landing-* CSS variables", () => {
    const vars = landingThemeToCssVars();

    expect(vars["--landing-whale-initial-scale"]).toBe("0.78");
    expect(vars["--landing-whale-initial-y"]).toBe("48px");
    expect(vars["--landing-whale-duration-ms"]).toBe("1600ms");
    expect(vars["--landing-carousel-neighbor-scale"]).toBe(
      String(landingPageTheme.carousel.neighborScale),
    );
    expect(vars["--landing-sphere-particle-count"]).toBe(
      String(landingPageTheme.sphere.particleCount),
    );
    expect(vars["--landing-sphere-repulsion"]).toBe(
      String(landingPageTheme.sphere.repulsion),
    );

    for (const key of Object.keys(vars)) {
      expect(key.startsWith("--landing-")).toBe(true);
    }
  });
});
