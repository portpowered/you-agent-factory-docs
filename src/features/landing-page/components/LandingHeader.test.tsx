import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { LandingHeader } from "./LandingHeader";

const FIXTURE_NAV = [
  { label: "Browse", href: "/browse" },
  { label: "Guides", href: "/docs/guides" },
  { label: "Blog", href: "/blog" },
  { label: "References", href: "/docs/references" },
] as const;

describe("LandingHeader", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders brand and fixture nav labels with matching hrefs", () => {
    render(
      <LandingHeader brand="you-agent-factory" items={[...FIXTURE_NAV]} />,
    );

    const header = screen.getByRole("banner");
    expect(header.getAttribute("data-landing-header")).toBe("");

    const brand = screen.getByRole("link", { name: "you-agent-factory" });
    expect(brand.getAttribute("href")).toBe("/");
    expect(brand.getAttribute("data-landing-header-brand")).toBe("");

    const nav = screen.getByRole("navigation", { name: "Landing" });
    expect(nav.getAttribute("data-landing-header-nav")).toBe("");

    for (const item of FIXTURE_NAV) {
      const link = within(header).getByRole("link", { name: item.label });
      expect(link.getAttribute("href")).toBe(item.href);
      expect(link.className).toContain("focus-visible:ring-2");
    }
  });

  test("empty items render stable header chrome without throwing", () => {
    render(<LandingHeader brand="you-agent-factory" items={[]} />);

    const header = screen.getByRole("banner");
    expect(header).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "you-agent-factory" }),
    ).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Landing" })).toBeTruthy();
    expect(
      header.querySelectorAll("[data-landing-header-nav-link]"),
    ).toHaveLength(0);
    expect(header.querySelector("[data-landing-header-search]")).toBeNull();
  });

  test("optional search slot renders when provided and is omitted otherwise", () => {
    const { rerender } = render(
      <LandingHeader
        items={[{ label: "Blog", href: "/blog" }]}
        search={<button type="button">Search docs</button>}
      />,
    );

    const searchHost = document.querySelector("[data-landing-header-search]");
    expect(searchHost).toBeTruthy();
    expect(
      within(searchHost as HTMLElement).getByRole("button", {
        name: "Search docs",
      }),
    ).toBeTruthy();

    rerender(<LandingHeader items={[{ label: "Blog", href: "/blog" }]} />);
    expect(document.querySelector("[data-landing-header-search]")).toBeNull();
    expect(screen.getByRole("link", { name: "Blog" })).toBeTruthy();
  });

  test("keeps the brand in the geometric center grid column", () => {
    render(<LandingHeader brand="YOU" items={[...FIXTURE_NAV]} />);

    const brand = screen.getByRole("link", { name: "YOU" });
    expect(brand.className).toContain("col-start-2");
    expect(brand.parentElement?.className).toContain(
      "grid-cols-[1fr_auto_1fr]",
    );
  });
});
