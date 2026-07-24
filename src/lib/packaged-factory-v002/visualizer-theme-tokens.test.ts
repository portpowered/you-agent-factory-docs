/**
 * Visualizer theme custom-property contract for packaged-factory 0.0.2 Batch 1.
 *
 * Required tokens resolve through the host components `@theme` cascade under
 * factory-dark and factory-light. Fail closed on missing / empty / invalid
 * values. No second hard-coded visualizer palette.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import {
  extractCssCustomPropertyMap,
  extractPaletteCustomPropertyMap,
  normalizeCssDeclarationValue,
  resolveCssCustomPropertyValue,
  resolveRequiredVisualizerThemeProperties,
} from "./visualizer-theme-token-resolution";
import {
  assertRequiredVisualizerThemePropertiesResolved,
  isUsableResolvedCssColorValue,
  PACKAGED_FACTORY_V002_HOST_THEME_PALETTES,
  PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
  VisualizerThemeTokenError,
} from "./visualizer-theme-tokens";
import {
  assertVisualizerStylesConsumeRequiredThemeProperties,
  provePackagedFactoryV002VisualizerThemeTokens,
} from "./visualizer-theme-tokens-proof";

const sampleRoleCss = `
@theme {
  --color-on-surface: var(--color-af-foundation-ink);
  --color-surface-container-low: rgb(
    from var(--color-af-foundation-overlay) r g b /
    0.04
  );
  --color-outline: rgb(from var(--color-af-foundation-overlay) r g b / 0.1);
  --color-error: var(--color-af-foundation-danger);
  --color-success: var(--color-af-foundation-success);
  --color-warning: var(--color-af-foundation-warning);
  --color-info: var(--color-af-foundation-info);
}
`;

const samplePaletteCss = `
:root,
[data-color-palette="factory-dark"] {
  --color-af-foundation-ink: #f7f2e8;
  --color-af-foundation-overlay: #ffffff;
  --color-af-foundation-danger: #f05f5f;
  --color-af-foundation-success: #57c18b;
  --color-af-foundation-warning: #f0b15a;
  --color-af-foundation-info: #5ccadd;
}

[data-color-palette="factory-light"] {
  --color-af-foundation-ink: #1a2228;
  --color-af-foundation-overlay: #000000;
  --color-af-foundation-danger: #d94848;
  --color-af-foundation-success: #2f9a66;
  --color-af-foundation-warning: #c9852d;
  --color-af-foundation-info: #2f8fad;
}
`;

describe("packaged-factory-v002 visualizer theme tokens", () => {
  let window: Window | undefined;

  afterEach(() => {
    window?.close();
    window = undefined;
  });

  test("required property list covers AC minimum set", () => {
    expect([
      ...PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
    ]).toEqual([
      "--color-on-surface",
      "--color-surface-container-low",
      "--color-outline",
      "--color-error",
      "--color-success",
      "--color-warning",
      "--color-info",
    ]);
    expect([...PACKAGED_FACTORY_V002_HOST_THEME_PALETTES]).toEqual([
      "factory-dark",
      "factory-light",
    ]);
  });

  test("isUsableResolvedCssColorValue accepts hex/rgb and rejects empty/var", () => {
    expect(isUsableResolvedCssColorValue("#f7f2e8")).toBe(true);
    expect(isUsableResolvedCssColorValue("rgba(255,255,255,0.1)")).toBe(true);
    expect(isUsableResolvedCssColorValue("")).toBe(false);
    expect(isUsableResolvedCssColorValue("var(--color-on-surface)")).toBe(
      false,
    );
    expect(isUsableResolvedCssColorValue("transparent")).toBe(false);
    expect(isUsableResolvedCssColorValue("initial")).toBe(false);
  });

  test("pure resolver resolves var() and rgb(from) under dark and light palettes", () => {
    const darkFoundation = extractPaletteCustomPropertyMap(
      samplePaletteCss,
      "factory-dark",
    );
    const lightFoundation = extractPaletteCustomPropertyMap(
      samplePaletteCss,
      "factory-light",
    );

    const dark = resolveRequiredVisualizerThemeProperties(
      [sampleRoleCss],
      darkFoundation,
    );
    const light = resolveRequiredVisualizerThemeProperties(
      [sampleRoleCss],
      lightFoundation,
    );

    expect(dark["--color-on-surface"]).toBe("#f7f2e8");
    expect(light["--color-on-surface"]).toBe("#1a2228");
    expect(dark["--color-error"]).toBe("#f05f5f");
    expect(light["--color-error"]).toBe("#d94848");
    expect(dark["--color-outline"]).toBe("rgba(255,255,255,0.1)");
    expect(light["--color-outline"]).toBe("rgba(0,0,0,0.1)");
    expect(dark["--color-surface-container-low"]).toBe(
      "rgba(255,255,255,0.04)",
    );

    expect(() =>
      assertRequiredVisualizerThemePropertiesResolved(dark),
    ).not.toThrow();
    expect(() =>
      assertRequiredVisualizerThemePropertiesResolved(light),
    ).not.toThrow();
  });

  test("fails closed when a required property is missing from resolved map", () => {
    const partial = {
      "--color-on-surface": "#f7f2e8",
      "--color-surface-container-low": "rgba(255,255,255,0.04)",
      "--color-outline": "rgba(255,255,255,0.1)",
      "--color-error": "#f05f5f",
      "--color-success": "#57c18b",
      "--color-warning": "#f0b15a",
      // --color-info intentionally omitted
    };
    expect(() =>
      assertRequiredVisualizerThemePropertiesResolved(partial),
    ).toThrow(VisualizerThemeTokenError);
    try {
      assertRequiredVisualizerThemePropertiesResolved(partial);
    } catch (error) {
      expect(error).toBeInstanceOf(VisualizerThemeTokenError);
      expect((error as VisualizerThemeTokenError).code).toBe(
        "missing-property",
      );
    }
  });

  test("fails closed when a required property resolves empty or still has var()", () => {
    expect(() =>
      assertRequiredVisualizerThemePropertiesResolved({
        "--color-on-surface": "",
        "--color-surface-container-low": "rgba(255,255,255,0.04)",
        "--color-outline": "rgba(255,255,255,0.1)",
        "--color-error": "#f05f5f",
        "--color-success": "#57c18b",
        "--color-warning": "#f0b15a",
        "--color-info": "#5ccadd",
      }),
    ).toThrow(/empty value/);

    expect(() =>
      assertRequiredVisualizerThemePropertiesResolved({
        "--color-on-surface": "var(--color-af-foundation-ink)",
        "--color-surface-container-low": "rgba(255,255,255,0.04)",
        "--color-outline": "rgba(255,255,255,0.1)",
        "--color-error": "#f05f5f",
        "--color-success": "#57c18b",
        "--color-warning": "#f0b15a",
        "--color-info": "#5ccadd",
      }),
    ).toThrow(VisualizerThemeTokenError);
  });

  test("fails closed when theme declaration for a required property is absent", () => {
    const foundation = extractPaletteCustomPropertyMap(
      samplePaletteCss,
      "factory-dark",
    );
    const incompleteRoleCss = `
@theme {
  --color-on-surface: var(--color-af-foundation-ink);
}
`;
    expect(() =>
      resolveRequiredVisualizerThemeProperties([incompleteRoleCss], foundation),
    ).toThrow(VisualizerThemeTokenError);
    try {
      resolveRequiredVisualizerThemeProperties([incompleteRoleCss], foundation);
    } catch (error) {
      expect(error).toBeInstanceOf(VisualizerThemeTokenError);
      expect((error as VisualizerThemeTokenError).code).toBe(
        "missing-theme-declaration",
      );
    }
  });

  test("fails closed when visualizers styles omit a required var() reference", () => {
    expect(() =>
      assertVisualizerStylesConsumeRequiredThemeProperties(
        ".x { color: var(--color-on-surface); }",
      ),
    ).toThrow(VisualizerThemeTokenError);
  });

  test("extract helpers normalize multi-line declarations", () => {
    const map = extractCssCustomPropertyMap(sampleRoleCss);
    expect(
      normalizeCssDeclarationValue(
        map.get("--color-surface-container-low") ?? "",
      ),
    ).toBe("rgb( from var(--color-af-foundation-overlay) r g b / 0.04 )");
    const foundation = extractPaletteCustomPropertyMap(
      samplePaletteCss,
      "factory-dark",
    );
    expect(
      resolveCssCustomPropertyValue(
        "--color-surface-container-low",
        map,
        foundation,
      ),
    ).toBe("rgba(255,255,255,0.04)");
  });

  test("host installed components + visualizers prove light and dark resolution", () => {
    const proof = provePackagedFactoryV002VisualizerThemeTokens();

    expect(proof.globalsCssPath).toContain("src/app/globals.css");
    expect(proof.componentsStylesPath.length).toBeGreaterThan(0);
    expect(proof.visualizersStylesPath.length).toBeGreaterThan(0);

    for (const palette of PACKAGED_FACTORY_V002_HOST_THEME_PALETTES) {
      const resolved = proof.resolvedByPalette[palette];
      assertRequiredVisualizerThemePropertiesResolved(resolved);
      for (const property of PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES) {
        expect(isUsableResolvedCssColorValue(resolved[property])).toBe(true);
      }
    }

    expect(
      proof.resolvedByPalette["factory-dark"][
        "--color-on-surface"
      ].toLowerCase(),
    ).toBe("#f7f2e8");
    expect(
      proof.resolvedByPalette["factory-light"][
        "--color-on-surface"
      ].toLowerCase(),
    ).toBe("#1a2228");
    expect(
      proof.resolvedByPalette["factory-dark"]["--color-error"].toLowerCase(),
    ).toBe("#f05f5f");
    expect(
      proof.resolvedByPalette["factory-light"]["--color-error"].toLowerCase(),
    ).toBe("#d94848");
  });

  test("resolved visualizer tokens paint usable colors on DOM under dark and light", () => {
    const proof = provePackagedFactoryV002VisualizerThemeTokens();
    window = new Window({ url: "https://example.test/" });
    const { document } = window;

    for (const palette of PACKAGED_FACTORY_V002_HOST_THEME_PALETTES) {
      const tokens = proof.resolvedByPalette[palette];
      const surface = document.createElement("div");
      surface.setAttribute("data-color-palette", palette);
      surface.style.color = tokens["--color-on-surface"];
      surface.style.backgroundColor = tokens["--color-surface-container-low"];
      surface.style.borderColor = tokens["--color-outline"];

      const status = document.createElement("span");
      status.style.color = tokens["--color-error"];
      status.dataset.success = tokens["--color-success"];
      status.dataset.warning = tokens["--color-warning"];
      status.dataset.info = tokens["--color-info"];

      document.body.append(surface, status);

      expect(surface.style.color.length).toBeGreaterThan(0);
      expect(surface.style.backgroundColor.length).toBeGreaterThan(0);
      expect(status.style.color.length).toBeGreaterThan(0);
      expect(isUsableResolvedCssColorValue(status.dataset.success ?? "")).toBe(
        true,
      );
      expect(isUsableResolvedCssColorValue(status.dataset.warning ?? "")).toBe(
        true,
      );
      expect(isUsableResolvedCssColorValue(status.dataset.info ?? "")).toBe(
        true,
      );
    }
  });
});
