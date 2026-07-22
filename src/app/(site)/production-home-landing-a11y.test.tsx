import { afterEach, describe, expect, spyOn, test } from "bun:test";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { LandingPage } from "@/features/landing-page/LandingPage";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import { listKeyboardFocusableControls } from "@/lib/verify/a11y-page-structure";
import { expectNoSeriousAxeViolations } from "@/tests/a11y/axe";
import { composeProductionLandingSlots } from "./compose-production-landing-slots";

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

const originalMatchMedia = window.matchMedia;
const originalGetContext = HTMLCanvasElement.prototype.getContext;

function stubCanvas2dContext() {
  HTMLCanvasElement.prototype.getContext = ((
    contextId: string,
  ): RenderingContext | null => {
    if (contextId !== "2d") return null;
    const gradient = { addColorStop: () => {} };
    return {
      clearRect: () => {},
      createRadialGradient: () => gradient,
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      setTransform: () => {},
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;
  }) as typeof HTMLCanvasElement.prototype.getContext;
}

/**
 * Wave C story 005: production `/` LandingPage a11y + reduced-motion contracts.
 * Behavioral asserts only — landmarks, keyboard-reachable LandingHeader nav,
 * ParticleSphere / WhalePlate reduce-motion paths intact under production compose.
 */
describe("production home LandingPage a11y + reduced-motion", () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  test("exposes landing landmarks, keyboard-reachable header nav, and no serious axe", async () => {
    stubCanvas2dContext();
    mockPrefersReducedMotion(false);

    await act(async () => {
      render(<LandingPage {...composeProductionLandingSlots()} />);
    });

    expect(document.querySelector("[data-landing-page]")).toBeTruthy();
    expect(document.querySelector("[data-landing-main]")).toBeTruthy();
    expect(document.querySelector("main")).toBeTruthy();

    // LandingHeader is the site chrome; HeroSection also uses a nested
    // <header> for copy, so query by landing marker rather than role=banner.
    const landingHeader = document.querySelector("[data-landing-header]");
    expect(landingHeader).toBeTruthy();

    for (const item of fixtureLandingPageData.header.nav) {
      const link = within(landingHeader as HTMLElement).getByRole("link", {
        name: item.label,
      });
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.className).toContain("focus-visible:ring");
    }

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: fixtureLandingPageData.hero.title.replace("\n", " "),
      }),
    ).toBeTruthy();

    const controls = listKeyboardFocusableControls(document);
    expect(controls.every((control) => control.name.length > 0)).toBe(true);
    expect(
      controls.some((control) =>
        fixtureLandingPageData.header.nav.some(
          (item) => item.href === control.href,
        ),
      ),
    ).toBe(true);

    await expectNoSeriousAxeViolations(document.body);
  });

  test("prefers-reduced-motion keeps ParticleSphere static with the shared whale scene", async () => {
    mockPrefersReducedMotion(true);
    stubCanvas2dContext();
    const rafSpy = spyOn(window, "requestAnimationFrame").mockImplementation(
      () => 1,
    );

    await act(async () => {
      render(<LandingPage {...composeProductionLandingSlots()} />);
    });

    await waitFor(() => {
      expect(
        document
          .querySelector("[data-particle-sphere]")
          ?.getAttribute("data-particle-sphere-motion"),
      ).toBe("static");
    });

    expect(rafSpy).not.toHaveBeenCalled();

    expect(document.querySelector("[data-whale-plate]")).toBeNull();
    expect(
      document.querySelector("[data-landing-mid-scene-whale]"),
    ).toBeTruthy();
    expect(document.querySelector("[data-whale-bubbles-section]")).toBeTruthy();
    expect(
      document
        .querySelector("[data-whale-bubbles-section]")
        ?.getAttribute("data-whale-bubbles-armed"),
    ).toBe("true");
    rafSpy.mockRestore();
  });
});
