import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { CtaBand } from "./CtaBand";

const FIXTURE = {
  headline: "Start a persistent factory run",
  supporting: "Ship workflows that survive long agent sessions.",
  ctaLabel: "Install the CLI",
  ctaHref: "/docs/guides",
  installCommand: "you run --named @goal/example",
} as const;

describe("CtaBand", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders fixture CTA label and href with fog atmosphere", () => {
    render(
      <CtaBand
        headline={FIXTURE.headline}
        supporting={FIXTURE.supporting}
        ctaLabel={FIXTURE.ctaLabel}
        ctaHref={FIXTURE.ctaHref}
        installCommand={FIXTURE.installCommand}
      />,
    );

    const band = screen.getByRole("region", { name: FIXTURE.headline });
    expect(band.getAttribute("data-landing-cta-band")).toBe("");
    expect(band.querySelector("[data-landing-cta-fog]")).toBeTruthy();
    expect(band.querySelector("[data-landing-cta-fog-mist]")).toBeTruthy();

    const fogImage = band.querySelector(
      "[data-landing-cta-fog-image]",
    ) as HTMLElement | null;
    expect(fogImage).toBeTruthy();
    expect(fogImage?.style.backgroundImage).toContain(landingHomeAssets.ctaFog);

    expect(
      screen.getByRole("heading", { level: 2, name: FIXTURE.headline }),
    ).toBeTruthy();
    expect(screen.getByText(FIXTURE.supporting)).toBeTruthy();
    expect(screen.getByText(FIXTURE.installCommand)).toBeTruthy();

    const cta = screen.getByRole("link", { name: FIXTURE.ctaLabel });
    expect(cta.getAttribute("href")).toBe(FIXTURE.ctaHref);
    expect(cta.getAttribute("data-landing-cta-action")).toBe("");
    expect(cta.className).toContain("focus-visible:ring-2");
  });

  test("omitting optional supporting fields still shows primary CTA", () => {
    render(<CtaBand headline={FIXTURE.headline} ctaLabel={FIXTURE.ctaLabel} />);

    const band = screen.getByRole("region", { name: FIXTURE.headline });
    expect(band.querySelector("[data-landing-cta-supporting]")).toBeNull();
    expect(band.querySelector("[data-landing-cta-command]")).toBeNull();
    expect(band.querySelector("[data-landing-cta-fog]")).toBeTruthy();

    const cta = screen.getByRole("button", { name: FIXTURE.ctaLabel });
    expect(cta.getAttribute("data-landing-cta-action")).toBe("");
    expect(cta.className).toContain("focus-visible:ring-2");
  });
});
