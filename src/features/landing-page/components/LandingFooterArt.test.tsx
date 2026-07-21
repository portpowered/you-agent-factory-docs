import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { SiteFooter } from "@/features/footer";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { LandingFooterArt } from "./LandingFooterArt";

describe("LandingFooterArt", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders decorative art root with default seadragon src", () => {
    render(<LandingFooterArt />);

    const root = screen.getByTestId("landing-footer-art");
    expect(root.getAttribute("data-landing-footer-art")).toBe("");
    expect(root.querySelector("[data-landing-footer-art-field]")).toBeTruthy();

    const image = root.querySelector(
      "[data-landing-footer-art-image]",
    ) as HTMLImageElement | null;
    expect(image).toBeTruthy();
    expect(image?.getAttribute("src")).toBe(landingHomeAssets.seadragonCrop);
    expect(image?.getAttribute("alt")).toBe("");
  });

  test("accepts optional src and className overrides", () => {
    render(
      <LandingFooterArt
        src="/home/you-you-you-background.png"
        className="max-w-md"
      />,
    );

    const root = screen.getByTestId("landing-footer-art");
    expect(root.className).toContain("max-w-md");

    const image = root.querySelector(
      "[data-landing-footer-art-image]",
    ) as HTMLImageElement | null;
    expect(image?.getAttribute("src")).toBe("/home/you-you-you-background.png");
  });

  test("renders stably inside SiteFooter art slot without editing footer package", () => {
    render(
      <SiteFooter
        columns={[
          {
            title: "Docs",
            links: [{ label: "Guides", href: "/docs/guides" }],
          },
        ]}
        meta={{ copyright: "© fixture" }}
        art={<LandingFooterArt />}
      />,
    );

    expect(screen.getByTestId("site-footer")).toBeTruthy();
    expect(screen.getByTestId("site-footer-art")).toBeTruthy();
    expect(screen.getByTestId("landing-footer-art")).toBeTruthy();
    expect(
      screen
        .getByTestId("landing-footer-art")
        .querySelector("[data-landing-footer-art-image]")
        ?.getAttribute("src"),
    ).toBe(landingHomeAssets.seadragonCrop);
  });
});
