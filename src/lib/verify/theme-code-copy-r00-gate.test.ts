import { afterEach, describe, expect, test } from "bun:test";
import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";
import {
  hexToRgbTuple,
  parseCssColorToRgb,
  probeThemeCodeCopyR00Blocks,
  probeThemeCodeCopyR00Chrome,
  rgbTuplesMatch,
  THEME_CODE_COPY_R00_FACTORY_DARK_RGB,
  THEME_CODE_COPY_R00_PALETTE_ATTR,
  THEME_CODE_COPY_R00_ROUTE,
} from "./theme-code-copy-r00-gate";

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-color-palette");
});

describe("theme-code-copy-r00-gate helpers", () => {
  test("route and factory-dark RGB proofs stay aligned with foundation hex", () => {
    expect(THEME_CODE_COPY_R00_ROUTE).toBe("/docs/guides/getting-started");
    expect(THEME_CODE_COPY_R00_FACTORY_DARK_RGB.background).toEqual(
      hexToRgbTuple(FACTORY_DARK_FOUNDATION.background),
    );
    expect(THEME_CODE_COPY_R00_FACTORY_DARK_RGB.primary).toEqual(
      hexToRgbTuple(FACTORY_DARK_FOUNDATION.accent),
    );
    expect(THEME_CODE_COPY_R00_FACTORY_DARK_RGB.secondary).toEqual(
      hexToRgbTuple(FACTORY_DARK_FOUNDATION.secondaryAccent),
    );
  });

  test("parseCssColorToRgb accepts hex and rgb forms", () => {
    expect(parseCssColorToRgb("#050b10")).toEqual([5, 11, 16]);
    expect(parseCssColorToRgb("rgb(245, 199, 111)")).toEqual([245, 199, 111]);
    expect(parseCssColorToRgb("rgba(80, 127, 140, 0.9)")).toEqual([
      80, 127, 140,
    ]);
    expect(parseCssColorToRgb("transparent")).toBeNull();
  });

  test("rgbTuplesMatch allows small channel tolerance", () => {
    expect(rgbTuplesMatch([80, 127, 140], [80, 127, 140])).toBe(true);
    expect(rgbTuplesMatch([80, 127, 140], [81, 126, 141], 2)).toBe(true);
    expect(rgbTuplesMatch([80, 127, 140], [90, 127, 140], 2)).toBe(false);
  });

  test("probeThemeCodeCopyR00Chrome accepts factory-dark semantic tokens", () => {
    const root = document.createElement("html");
    root.setAttribute("data-color-palette", THEME_CODE_COPY_R00_PALETTE_ATTR);
    const vars: Record<string, string> = {
      "--background": FACTORY_DARK_FOUNDATION.background,
      "--primary": FACTORY_DARK_FOUNDATION.accent,
      "--secondary": FACTORY_DARK_FOUNDATION.secondaryAccent,
    };

    const probe = probeThemeCodeCopyR00Chrome(root, (name) => vars[name] ?? "");
    expect(probe.matchesFactoryDark).toBe(true);
    expect(probe.colorPalette).toBe("factory-dark");
  });

  test("probeThemeCodeCopyR00Chrome rejects legacy teal primary", () => {
    const root = document.createElement("html");
    root.setAttribute("data-color-palette", "factory-dark");
    const vars: Record<string, string> = {
      "--background": "#050b10",
      "--primary": "oklch(0.6 0.1 200)",
      "--secondary": "#507f8c",
    };

    const probe = probeThemeCodeCopyR00Chrome(root, (name) => vars[name] ?? "");
    expect(probe.matchesFactoryDark).toBe(false);
  });

  test("probeThemeCodeCopyR00Blocks reports rail/copy non-overlap markers", () => {
    document.body.innerHTML = `
      <figure class="docs-code-block">
        <div data-rich-content-scroll="code" class="docs-code-block__viewport"></div>
        <div data-docs-code-actions="rail">
          <button data-docs-code-copy="control" style="opacity: 1">Copy</button>
        </div>
      </figure>
    `;

    const probe = probeThemeCodeCopyR00Blocks(document);
    expect(probe.railCount).toBe(1);
    expect(probe.copyControlCount).toBe(1);
    expect(probe.firstCopyOutsideViewport).toBe(true);
    expect(probe.firstRailOutsideViewport).toBe(true);
    expect(probe.firstCopyOpacity).toBe(1);
    // Inset px is asserted in the served-page Chromium gate; happy-dom often
    // reports 0 for inline padding-inline.
  });
});
