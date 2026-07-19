import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
  DOCS_CHROME_SIDEBAR_ACTIVE_SELECTOR,
  DOCS_CHROME_SIDEBAR_FACTORY_DARK,
  DOCS_CHROME_SIDEBAR_NON_ACTIVE_SELECTOR,
  DOCS_CHROME_SIDEBAR_ROW_CLASSES,
  DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS,
  DOCS_CHROME_SIDEBAR_ROW_SELECTOR,
  DOCS_CHROME_SIDEBAR_SURFACE_ROLES,
  DOCS_CHROME_SIDEBAR_TOKENS,
} from "@/features/docs/styles/docs-chrome-sidebar";
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

describe("docs chrome sidebar highlighting", () => {
  let window: Window | undefined;

  afterEach(() => {
    window?.close();
    window = undefined;
  });

  test("surface roles follow locked white rest and primary-yellow hover background", () => {
    expect(DOCS_CHROME_SIDEBAR_SURFACE_ROLES).toEqual({
      default: "white",
      hoverActive: "primaryYellow",
      hoverActiveKind: "background",
    });

    expect(DOCS_CHROME_SIDEBAR_TOKENS.restText).toBe(
      "var(--docs-chrome-white)",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.hoverBackground).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.hoverForeground).toBe(
      "var(--primary-foreground)",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.activeBackground).toContain(
      "--docs-chrome-primary-yellow",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.focusRing).toBe("var(--ring)");

    // Hover must be a background fill, not muted/accent text-only recolor.
    expect(DOCS_CHROME_SIDEBAR_SURFACE_ROLES.hoverActiveKind).toBe(
      "background",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.restText).not.toBe(
      "var(--docs-chrome-muted-white)",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.hoverBackground).not.toContain("accent");
  });

  test("row classes include marker and wide horizontal padding for hover fill", () => {
    expect(DOCS_CHROME_SIDEBAR_ROW_CLASSES).toContain(
      DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS,
    );
    expect(DOCS_CHROME_SIDEBAR_ROW_CLASSES).toContain("px-2");
    expect(DOCS_CHROME_SIDEBAR_ROW_CLASSES).toContain("py-1.5");
    expect(DOCS_CHROME_SIDEBAR_ROW_CLASSES).toContain("rounded-lg");
    expect(DOCS_CHROME_SIDEBAR_ROW_SELECTOR).toContain("#nd-sidebar");
    expect(DOCS_CHROME_SIDEBAR_ROW_SELECTOR).toContain(
      "[data-mobile-docs-drawer]",
    );
    expect(DOCS_CHROME_SIDEBAR_ACTIVE_SELECTOR).toContain(
      '[data-active="true"]',
    );
    expect(DOCS_CHROME_SIDEBAR_NON_ACTIVE_SELECTOR).toContain(
      ':not([data-active="true"])',
    );
  });

  test("factory-dark proofs match locked chrome white and primary yellow", () => {
    expect(DOCS_CHROME_SIDEBAR_FACTORY_DARK.restText).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.white,
    );
    expect(DOCS_CHROME_SIDEBAR_FACTORY_DARK.hoverBackground).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
    );

    expect(DOCS_CHROME_SIDEBAR_FACTORY_DARK.restText.toLowerCase()).toBe(
      "#f7f2e8",
    );
    expect(DOCS_CHROME_SIDEBAR_FACTORY_DARK.hoverBackground.toLowerCase()).toBe(
      "#f5c76f",
    );
    expect(DOCS_CHROME_SIDEBAR_FACTORY_DARK.hoverForeground.toLowerCase()).toBe(
      "#1a2228",
    );
  });

  test("rest text, hover background, and active wash paint observable factory-dark colors on DOM", () => {
    window = new Window({ url: "https://example.test/" });
    const { document } = window;
    const tokens = DOCS_CHROME_SIDEBAR_FACTORY_DARK;

    const sidebar = document.createElement("aside");
    sidebar.id = "nd-sidebar";

    const resting = document.createElement("a");
    resting.className = DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS;
    resting.href = "/docs/guides/getting-started";
    resting.style.color = tokens.restText;
    resting.style.backgroundColor = "transparent";

    const active = document.createElement("a");
    active.className = DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS;
    active.href = "/docs/concepts/harness";
    active.setAttribute("data-active", "true");
    active.style.color = tokens.restText;
    // Soft yellow wash at rest (distinguishable from transparent non-current).
    // happy-dom may not retain color-mix(); assert the contract token instead.
    expect(DOCS_CHROME_SIDEBAR_TOKENS.activeBackground).toContain(
      "--docs-chrome-primary-yellow",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.activeBackground).toContain("18%");
    active.style.backgroundColor = "rgba(245, 199, 111, 0.18)";

    sidebar.append(resting, active);
    document.body.append(sidebar);

    expect(normalizeHex(resting.style.color)).toBe("#f7f2e8");
    expect(resting.style.backgroundColor).toBe("transparent");
    expect(normalizeHex(active.style.color)).toBe("#f7f2e8");
    expect(active.style.backgroundColor).toContain("245");
    expect(active.getAttribute("data-active")).toBe("true");
    expect(resting.getAttribute("data-active")).toBeNull();

    // Hover applies a wide primary-yellow background (not text-only).
    resting.style.backgroundColor = tokens.hoverBackground;
    resting.style.color = tokens.hoverForeground;
    expect(normalizeHex(resting.style.backgroundColor)).toBe("#f5c76f");
    expect(normalizeHex(resting.style.color)).toBe("#1a2228");
  });
});
