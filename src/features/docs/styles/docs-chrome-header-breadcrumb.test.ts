import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
  DOCS_CHROME_BREADCRUMB_FACTORY_DARK,
  DOCS_CHROME_BREADCRUMB_LINK_CLASSES,
  DOCS_CHROME_BREADCRUMB_LINK_MARKER_CLASS,
  DOCS_CHROME_BREADCRUMB_LINK_SELECTOR,
  DOCS_CHROME_BREADCRUMB_PAGE_CLASSES,
  DOCS_CHROME_BREADCRUMB_PAGE_MARKER_CLASS,
  DOCS_CHROME_BREADCRUMB_PAGE_SELECTOR,
  DOCS_CHROME_BREADCRUMB_SURFACE_ROLES,
  DOCS_CHROME_BREADCRUMB_TOKENS,
  DOCS_CHROME_HEADER_FACTORY_DARK,
  DOCS_CHROME_HEADER_ICON_CLASSES,
  DOCS_CHROME_HEADER_ICON_MARKER_CLASS,
  DOCS_CHROME_HEADER_ICON_SELECTOR,
  DOCS_CHROME_HEADER_SURFACE_ROLES,
  DOCS_CHROME_HEADER_TEXT_CLASSES,
  DOCS_CHROME_HEADER_TEXT_MARKER_CLASS,
  DOCS_CHROME_HEADER_TEXT_SELECTOR,
  DOCS_CHROME_HEADER_TOKENS,
} from "@/features/docs/styles/docs-chrome-header-breadcrumb";
import { DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK } from "@/lib/theme/docs-chrome-highlighting-tokens";

function normalizeHex(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith("#") && trimmed.length === 7) {
    return trimmed;
  }
  const rgb = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgb) {
    return trimmed;
  }
  const toHex = (channel: string) =>
    Number(channel).toString(16).padStart(2, "0");
  return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
}

describe("docs chrome header + breadcrumb highlighting", () => {
  let window: Window | undefined;

  afterEach(() => {
    window?.close();
    window = undefined;
  });

  test("header surface roles follow locked white rest and primary-yellow overlay", () => {
    expect(DOCS_CHROME_HEADER_SURFACE_ROLES).toEqual({
      default: "white",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });

    expect(DOCS_CHROME_HEADER_TOKENS.restText).toBe("var(--docs-chrome-white)");
    expect(DOCS_CHROME_HEADER_TOKENS.hoverOverlay).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_CHROME_HEADER_TOKENS.focusRing).toBe("var(--ring)");

    // Must not leave header rest on muted white or hover on foreground/accent.
    expect(DOCS_CHROME_HEADER_TOKENS.restText).not.toBe(
      "var(--docs-chrome-muted-white)",
    );
    expect(DOCS_CHROME_HEADER_TOKENS.hoverOverlay).not.toContain("accent");
    expect(DOCS_CHROME_HEADER_TOKENS.hoverOverlay).not.toBe(
      "var(--docs-chrome-white)",
    );
  });

  test("breadcrumb surface roles follow locked muted-white rest and primary-yellow overlay", () => {
    expect(DOCS_CHROME_BREADCRUMB_SURFACE_ROLES).toEqual({
      default: "mutedWhite",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });

    expect(DOCS_CHROME_BREADCRUMB_TOKENS.restText).toBe(
      "var(--docs-chrome-muted-white)",
    );
    expect(DOCS_CHROME_BREADCRUMB_TOKENS.hoverOverlay).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_CHROME_BREADCRUMB_TOKENS.focusRing).toBe("var(--ring)");

    // Must not leave breadcrumb hover on foreground white.
    expect(DOCS_CHROME_BREADCRUMB_TOKENS.hoverOverlay).not.toBe(
      "var(--docs-chrome-white)",
    );
    expect(DOCS_CHROME_BREADCRUMB_TOKENS.restText).not.toBe(
      "var(--docs-chrome-white)",
    );
  });

  test("selectors and marker classes target header text/icons and breadcrumb crumbs", () => {
    expect(DOCS_CHROME_HEADER_TEXT_CLASSES).toContain(
      DOCS_CHROME_HEADER_TEXT_MARKER_CLASS,
    );
    expect(DOCS_CHROME_HEADER_ICON_CLASSES).toContain(
      DOCS_CHROME_HEADER_ICON_MARKER_CLASS,
    );
    expect(DOCS_CHROME_BREADCRUMB_LINK_CLASSES).toContain(
      DOCS_CHROME_BREADCRUMB_LINK_MARKER_CLASS,
    );
    expect(DOCS_CHROME_BREADCRUMB_PAGE_CLASSES).toContain(
      DOCS_CHROME_BREADCRUMB_PAGE_MARKER_CLASS,
    );

    expect(DOCS_CHROME_HEADER_TEXT_SELECTOR).toContain("header");
    expect(DOCS_CHROME_HEADER_ICON_SELECTOR).toContain("header");
    expect(DOCS_CHROME_BREADCRUMB_LINK_SELECTOR).toContain(
      'nav[aria-label="breadcrumb"]',
    );
    expect(DOCS_CHROME_BREADCRUMB_PAGE_SELECTOR).toContain(
      'nav[aria-label="breadcrumb"]',
    );

    expect(DOCS_CHROME_HEADER_TEXT_CLASSES).toContain(
      "focus-visible:ring-ring",
    );
    expect(DOCS_CHROME_HEADER_ICON_CLASSES).toContain(
      "focus-visible:ring-ring",
    );
  });

  test("factory-dark proofs match locked chrome white, muted white, and primary yellow", () => {
    expect(DOCS_CHROME_HEADER_FACTORY_DARK.restText).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.white,
    );
    expect(DOCS_CHROME_HEADER_FACTORY_DARK.hoverOverlay).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
    );
    expect(DOCS_CHROME_BREADCRUMB_FACTORY_DARK.restText).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.mutedWhite,
    );
    expect(DOCS_CHROME_BREADCRUMB_FACTORY_DARK.hoverOverlay).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
    );

    expect(DOCS_CHROME_HEADER_FACTORY_DARK.restText.toLowerCase()).toBe(
      "#f7f2e8",
    );
    expect(DOCS_CHROME_HEADER_FACTORY_DARK.hoverOverlay.toLowerCase()).toBe(
      "#f5c76f",
    );
    expect(DOCS_CHROME_BREADCRUMB_FACTORY_DARK.restText.toLowerCase()).toBe(
      "#8aaeb8",
    );
    expect(DOCS_CHROME_BREADCRUMB_FACTORY_DARK.hoverOverlay.toLowerCase()).toBe(
      "#f5c76f",
    );
  });

  test("header and breadcrumb paint observable factory-dark colors on DOM", () => {
    window = new Window({ url: "https://example.test/" });
    const { document } = window;
    const headerTokens = DOCS_CHROME_HEADER_FACTORY_DARK;
    const breadcrumbTokens = DOCS_CHROME_BREADCRUMB_FACTORY_DARK;

    const header = document.createElement("header");
    const brand = document.createElement("a");
    brand.className = DOCS_CHROME_HEADER_TEXT_MARKER_CLASS;
    brand.href = "/";
    brand.style.color = headerTokens.restText;

    const navLink = document.createElement("a");
    navLink.className = DOCS_CHROME_HEADER_TEXT_MARKER_CLASS;
    navLink.href = "/docs";
    navLink.style.color = headerTokens.restText;

    const menu = document.createElement("button");
    menu.className = DOCS_CHROME_HEADER_ICON_MARKER_CLASS;
    menu.type = "button";
    menu.style.color = headerTokens.restText;

    header.append(brand, navLink, menu);
    document.body.append(header);

    const crumbNav = document.createElement("nav");
    crumbNav.setAttribute("aria-label", "breadcrumb");
    const crumbLink = document.createElement("a");
    crumbLink.className = DOCS_CHROME_BREADCRUMB_LINK_MARKER_CLASS;
    crumbLink.href = "/";
    crumbLink.style.color = breadcrumbTokens.restText;
    const crumbPage = document.createElement("span");
    crumbPage.className = DOCS_CHROME_BREADCRUMB_PAGE_MARKER_CLASS;
    crumbPage.style.color = breadcrumbTokens.restText;
    crumbNav.append(crumbLink, crumbPage);
    document.body.append(crumbNav);

    expect(normalizeHex(brand.style.color)).toBe("#f7f2e8");
    expect(normalizeHex(navLink.style.color)).toBe("#f7f2e8");
    expect(normalizeHex(menu.style.color)).toBe("#f7f2e8");
    expect(normalizeHex(crumbLink.style.color)).toBe("#8aaeb8");
    expect(normalizeHex(crumbPage.style.color)).toBe("#8aaeb8");

    brand.style.color = headerTokens.hoverOverlay;
    navLink.style.color = headerTokens.hoverOverlay;
    menu.style.color = headerTokens.hoverOverlay;
    crumbLink.style.color = breadcrumbTokens.hoverOverlay;

    expect(normalizeHex(brand.style.color)).toBe("#f5c76f");
    expect(normalizeHex(navLink.style.color)).toBe("#f5c76f");
    expect(normalizeHex(menu.style.color)).toBe("#f5c76f");
    expect(normalizeHex(crumbLink.style.color)).toBe("#f5c76f");
  });
});
