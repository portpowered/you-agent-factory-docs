import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
  DOCS_CHROME_HEADER_ACTION_ICON_CLASS,
  DOCS_CHROME_HEADER_ACTION_ICON_CLASSES,
  DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK,
  DOCS_CHROME_SEARCH_GLOBE_GITHUB_SURFACE_ROLES,
  DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS,
  docsChromeSearchGlobeGitHubHoverStyle,
  docsChromeSearchKbdHoverStyle,
} from "@/features/docs/styles/docs-chrome-search-globe-github";
import { DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK } from "@/lib/theme/docs-chrome-highlighting-tokens";
import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";

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

describe("docs chrome search / globe / GitHub highlighting", () => {
  let window: Window | undefined;

  afterEach(() => {
    window?.close();
    window = undefined;
  });

  test("surface follows locked surrounding-background rest and primary-yellow hover", () => {
    expect(DOCS_CHROME_SEARCH_GLOBE_GITHUB_SURFACE_ROLES).toEqual({
      default: "surroundingChromeBackground",
      hoverActive: "primaryYellow",
      hoverActiveKind: "overlay",
    });

    expect(DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.restBackground).toBe(
      "var(--docs-chrome-surrounding-background)",
    );
    expect(DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.hoverActiveOverlay).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.hoverActiveForeground).toBe(
      "var(--primary-foreground)",
    );
    expect(DOCS_CHROME_HEADER_ACTION_ICON_CLASS).toBe("header-action-icon");
    expect(DOCS_CHROME_HEADER_ACTION_ICON_CLASSES).toContain(
      "header-action-icon",
    );
    expect(DOCS_CHROME_HEADER_ACTION_ICON_CLASSES).toContain(
      "!bg-[var(--docs-chrome-surrounding-background)]",
    );
    expect(DOCS_CHROME_HEADER_ACTION_ICON_CLASSES).toContain(
      "hover:!bg-[var(--docs-chrome-primary-yellow)]",
    );

    // Must not target accent-strong / secondary color-mix for this surface.
    expect(DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.hoverActiveOverlay).not.toBe(
      "var(--accent)",
    );
    expect(
      DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.hoverActiveOverlay,
    ).not.toContain("secondary");
  });

  test("factory-dark proofs match locked chrome yellow and surrounding background", () => {
    expect(DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK.restBackground).toBe(
      DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.surroundingChromeBackground,
    );
    expect(
      DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK.hoverActiveOverlay,
    ).toBe(DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow);
    expect(
      DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK.hoverActiveForeground,
    ).toBe(FACTORY_DARK_FOUNDATION.accentInk);

    expect(
      DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK.restBackground.toLowerCase(),
    ).toBe("#050b10");
    expect(
      DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK.hoverActiveOverlay.toLowerCase(),
    ).toBe("#f5c76f");
  });

  test("hover helpers paint primary yellow overlay and clear when not hovered", () => {
    expect(docsChromeSearchGlobeGitHubHoverStyle(false)).toBeUndefined();
    expect(docsChromeSearchKbdHoverStyle(false)).toBeUndefined();

    const hover = docsChromeSearchGlobeGitHubHoverStyle(true);
    expect(hover?.backgroundColor).toBe("var(--docs-chrome-primary-yellow)");
    expect(hover?.borderColor).toBe("var(--docs-chrome-primary-yellow)");
    expect(hover?.color).toBe("var(--primary-foreground)");

    const kbd = docsChromeSearchKbdHoverStyle(true);
    expect(kbd?.color).toBe("var(--primary-foreground)");
    expect(kbd?.borderColor).toContain("var(--primary-foreground)");
  });

  test("rest and hover paint observable factory-dark colors on DOM controls", () => {
    window = new Window({ url: "https://example.test/" });
    const { document } = window;
    const tokens = DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK;

    const search = document.createElement("button");
    search.setAttribute("data-search", "");
    search.style.backgroundColor = tokens.restBackground;

    const globe = document.createElement("button");
    globe.className = DOCS_CHROME_HEADER_ACTION_ICON_CLASS;
    globe.style.backgroundColor = tokens.restBackground;

    const github = document.createElement("a");
    github.className = DOCS_CHROME_HEADER_ACTION_ICON_CLASS;
    github.style.backgroundColor = tokens.restBackground;

    document.body.append(search, globe, github);

    expect(normalizeHex(search.style.backgroundColor)).toBe("#050b10");
    expect(normalizeHex(globe.style.backgroundColor)).toBe("#050b10");
    expect(normalizeHex(github.style.backgroundColor)).toBe("#050b10");

    search.style.backgroundColor = tokens.hoverActiveOverlay;
    globe.style.backgroundColor = tokens.hoverActiveOverlay;
    github.style.backgroundColor = tokens.hoverActiveOverlay;

    expect(normalizeHex(search.style.backgroundColor)).toBe("#f5c76f");
    expect(normalizeHex(globe.style.backgroundColor)).toBe("#f5c76f");
    expect(normalizeHex(github.style.backgroundColor)).toBe("#f5c76f");
  });
});
