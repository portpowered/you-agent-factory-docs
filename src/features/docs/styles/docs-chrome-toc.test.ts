import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
  DOCS_CHROME_TOC_CURRENT_SELECTOR,
  DOCS_CHROME_TOC_CURRENT_SURFACE_ROLES,
  DOCS_CHROME_TOC_FACTORY_DARK,
  DOCS_CHROME_TOC_ITEM_SELECTOR,
  DOCS_CHROME_TOC_NON_CURRENT_SELECTOR,
  DOCS_CHROME_TOC_NON_CURRENT_SURFACE_ROLES,
  DOCS_CHROME_TOC_THUMB_SELECTOR,
  DOCS_CHROME_TOC_TOKENS,
} from "@/features/docs/styles/docs-chrome-toc";
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

describe("docs chrome TOC highlighting", () => {
  let window: Window | undefined;

  afterEach(() => {
    window?.close();
    window = undefined;
  });

  test("surface roles follow locked secondary-blue current and muted-white non-current", () => {
    expect(DOCS_CHROME_TOC_CURRENT_SURFACE_ROLES).toEqual({
      default: "secondaryBlue",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });
    expect(DOCS_CHROME_TOC_NON_CURRENT_SURFACE_ROLES).toEqual({
      default: "mutedWhite",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });

    expect(DOCS_CHROME_TOC_TOKENS.currentRest).toBe(
      "var(--docs-chrome-secondary-blue)",
    );
    expect(DOCS_CHROME_TOC_TOKENS.nonCurrentRest).toBe(
      "var(--docs-chrome-muted-white)",
    );
    expect(DOCS_CHROME_TOC_TOKENS.hoverOverlay).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_CHROME_TOC_TOKENS.focusRing).toBe("var(--ring)");

    // Must not leave current on primary yellow or hover on accent-foreground.
    expect(DOCS_CHROME_TOC_TOKENS.currentRest).not.toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_CHROME_TOC_TOKENS.hoverOverlay).not.toContain("accent");
  });

  test("selectors target right-rail and popover TOC anchors", () => {
    expect(DOCS_CHROME_TOC_ITEM_SELECTOR).toContain("#nd-toc");
    expect(DOCS_CHROME_TOC_ITEM_SELECTOR).toContain("[data-toc-popover]");
    expect(DOCS_CHROME_TOC_CURRENT_SELECTOR).toContain('[data-active="true"]');
    expect(DOCS_CHROME_TOC_NON_CURRENT_SELECTOR).toContain(
      ':not([data-active="true"])',
    );
    expect(DOCS_CHROME_TOC_THUMB_SELECTOR).toContain(".bg-fd-primary");
  });

  test("factory-dark proofs match locked chrome secondary blue, muted white, yellow", () => {
    expect(DOCS_CHROME_TOC_FACTORY_DARK.currentRest).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.secondaryBlue,
    );
    expect(DOCS_CHROME_TOC_FACTORY_DARK.nonCurrentRest).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.mutedWhite,
    );
    expect(DOCS_CHROME_TOC_FACTORY_DARK.hoverOverlay).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
    );

    expect(DOCS_CHROME_TOC_FACTORY_DARK.currentRest.toLowerCase()).toBe(
      "#507f8c",
    );
    expect(DOCS_CHROME_TOC_FACTORY_DARK.nonCurrentRest.toLowerCase()).toBe(
      "#8aaeb8",
    );
    expect(DOCS_CHROME_TOC_FACTORY_DARK.hoverOverlay.toLowerCase()).toBe(
      "#f5c76f",
    );
  });

  test("current, non-current, and hover paint observable factory-dark colors on DOM", () => {
    window = new Window({ url: "https://example.test/" });
    const { document } = window;
    const tokens = DOCS_CHROME_TOC_FACTORY_DARK;

    const rail = document.createElement("div");
    rail.id = "nd-toc";

    const current = document.createElement("a");
    current.href = "#what-it-is";
    current.setAttribute("data-active", "true");
    current.style.color = tokens.currentRest;

    const nonCurrent = document.createElement("a");
    nonCurrent.href = "#why-it-matters";
    nonCurrent.style.color = tokens.nonCurrentRest;

    const thumb = document.createElement("div");
    thumb.className = "bg-fd-primary";
    thumb.style.backgroundColor = tokens.currentRest;

    rail.append(current, nonCurrent, thumb);
    document.body.append(rail);

    expect(normalizeHex(current.style.color)).toBe("#507f8c");
    expect(normalizeHex(nonCurrent.style.color)).toBe("#8aaeb8");
    expect(normalizeHex(thumb.style.backgroundColor)).toBe("#507f8c");

    current.style.color = tokens.hoverOverlay;
    nonCurrent.style.color = tokens.hoverOverlay;

    expect(normalizeHex(current.style.color)).toBe("#f5c76f");
    expect(normalizeHex(nonCurrent.style.color)).toBe("#f5c76f");
  });
});
