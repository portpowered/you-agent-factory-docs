import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
  DOCS_CHROME_HIGHLIGHTING_CSS_VARS,
  DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK,
  DOCS_CHROME_HIGHLIGHTING_HOST_BINDINGS,
  DOCS_CHROME_HIGHLIGHTING_ROLE_NAMES,
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES,
  DOCS_CHROME_HIGHLIGHTING_SURFACES,
  DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS,
  resolveDocsChromeHighlightingTokens,
} from "@/lib/theme/docs-chrome-highlighting-tokens";
import {
  FACTORY_DARK_FOUNDATION,
  resolveHostSemanticThemeTokens,
} from "@/lib/theme/host-semantic-theme-tokens";

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

describe("docs chrome highlighting tokens (locked map)", () => {
  let window: Window | undefined;

  afterEach(() => {
    window?.close();
    window = undefined;
  });

  test("exposes the five locked map roles via host semantic bindings", () => {
    expect([...DOCS_CHROME_HIGHLIGHTING_ROLE_NAMES]).toEqual([
      "surroundingChromeBackground",
      "primaryYellow",
      "secondaryBlue",
      "white",
      "mutedWhite",
    ]);

    expect(DOCS_CHROME_HIGHLIGHTING_HOST_BINDINGS).toEqual({
      surroundingChromeBackground: "background",
      primaryYellow: "primary",
      secondaryBlue: "secondary",
      white: "foreground",
      mutedWhite: "muted-foreground",
    });

    expect(DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS).toEqual({
      surroundingChromeBackground: "var(--background)",
      primaryYellow: "var(--primary)",
      secondaryBlue: "var(--secondary)",
      white: "var(--foreground)",
      mutedWhite: "var(--muted-foreground)",
    });

    for (const role of DOCS_CHROME_HIGHLIGHTING_ROLE_NAMES) {
      expect(DOCS_CHROME_HIGHLIGHTING_CSS_VARS[role]).toMatch(
        /^--docs-chrome-/,
      );
      expect(DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS[role]).toMatch(/^var\(--/);
      expect(DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS[role]).not.toMatch(
        /#[0-9a-f]/i,
      );
      expect(DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS[role]).not.toContain("oklch(");
    }
  });

  test("factory-dark proofs match host semantic yellow / blue / white / muted white", () => {
    const host = resolveHostSemanticThemeTokens();
    const chrome = resolveDocsChromeHighlightingTokens();

    expect(chrome.surroundingChromeBackground).toBe(host.background);
    expect(chrome.primaryYellow).toBe(host.primary);
    expect(chrome.secondaryBlue).toBe(host.secondary);
    expect(chrome.white).toBe(host.foreground);
    expect(chrome.mutedWhite).toBe(host["muted-foreground"]);

    expect(chrome.primaryYellow.toLowerCase()).toBe("#f5c76f");
    expect(chrome.secondaryBlue.toLowerCase()).toBe("#507f8c");
    expect(chrome.white.toLowerCase()).toBe("#f7f2e8");
    expect(chrome.mutedWhite.toLowerCase()).toBe("#8aaeb8");
    expect(chrome.surroundingChromeBackground.toLowerCase()).toBe("#050b10");

    expect(DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow).toBe(
      FACTORY_DARK_FOUNDATION.accent,
    );
    expect(DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.secondaryBlue).toBe(
      FACTORY_DARK_FOUNDATION.secondaryAccent,
    );
  });

  test("surface role map encodes defaults, primary-yellow hover, and sidebar secondary-blue selected", () => {
    expect([...DOCS_CHROME_HIGHLIGHTING_SURFACES]).toEqual([
      "searchGlobeGitHub",
      "tocCurrent",
      "tocNonCurrent",
      "sidebarRow",
      "headerTextIcons",
      "breadcrumb",
    ]);

    expect(DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.searchGlobeGitHub).toEqual({
      default: "surroundingChromeBackground",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });
    expect(DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.tocCurrent).toEqual({
      default: "secondaryBlue",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });
    expect(DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.tocNonCurrent).toEqual({
      default: "mutedWhite",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });
    expect(DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.sidebarRow).toEqual({
      default: "white",
      hoverActive: "primaryYellow",
      hoverActiveKind: "background",
      selectedActive: "secondaryBlue",
    });
    expect(DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.headerTextIcons).toEqual({
      default: "white",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });
    expect(DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.breadcrumb).toEqual({
      default: "mutedWhite",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });

    for (const surface of DOCS_CHROME_HIGHLIGHTING_SURFACES) {
      expect(DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES[surface].hoverActive).toBe(
        "primaryYellow",
      );
    }
    // Only sidebar separates selected/active (secondary blue) from hover yellow.
    expect(
      DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.sidebarRow.selectedActive,
    ).toBe("secondaryBlue");
    for (const surface of DOCS_CHROME_HIGHLIGHTING_SURFACES) {
      if (surface === "sidebarRow") {
        continue;
      }
      const roles = DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES[surface];
      expect("selectedActive" in roles ? roles.selectedActive : undefined).toBe(
        undefined,
      );
    }
  });

  test("chrome roles paint observable factory-dark colors on DOM surfaces", () => {
    window = new Window({ url: "https://example.test/" });
    const { document } = window;
    const tokens = resolveDocsChromeHighlightingTokens();

    const shell = document.createElement("div");
    shell.style.backgroundColor = tokens.surroundingChromeBackground;

    const tocCurrent = document.createElement("a");
    tocCurrent.style.color = tokens.secondaryBlue;

    const tocNonCurrent = document.createElement("a");
    tocNonCurrent.style.color = tokens.mutedWhite;

    const sidebarRow = document.createElement("a");
    sidebarRow.style.color = tokens.white;
    sidebarRow.style.backgroundColor = tokens.primaryYellow;

    const sidebarActive = document.createElement("a");
    sidebarActive.setAttribute("data-active", "true");
    sidebarActive.style.color = tokens.white;
    sidebarActive.style.backgroundColor = "rgba(80, 127, 140, 0.18)";

    const headerIcon = document.createElement("button");
    headerIcon.style.color = tokens.white;
    headerIcon.style.backgroundColor = tokens.surroundingChromeBackground;

    document.body.append(
      shell,
      tocCurrent,
      tocNonCurrent,
      sidebarRow,
      sidebarActive,
      headerIcon,
    );

    expect(normalizeHex(shell.style.backgroundColor)).toBe("#050b10");
    expect(normalizeHex(tocCurrent.style.color)).toBe("#507f8c");
    expect(normalizeHex(tocNonCurrent.style.color)).toBe("#8aaeb8");
    expect(normalizeHex(sidebarRow.style.color)).toBe("#f7f2e8");
    expect(normalizeHex(sidebarRow.style.backgroundColor)).toBe("#f5c76f");
    expect(normalizeHex(sidebarActive.style.color)).toBe("#f7f2e8");
    expect(sidebarActive.style.backgroundColor).toContain("80");
    expect(sidebarActive.style.backgroundColor).toContain("127");
    expect(sidebarActive.style.backgroundColor).toContain("140");
    expect(normalizeHex(tokens.secondaryBlue)).toBe("#507f8c");
    expect(normalizeHex(headerIcon.style.color)).toBe("#f7f2e8");
    expect(normalizeHex(headerIcon.style.backgroundColor)).toBe("#050b10");
  });
});
