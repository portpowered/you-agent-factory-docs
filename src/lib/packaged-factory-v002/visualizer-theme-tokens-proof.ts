/**
 * Observable host proof: required visualizer theme custom properties resolve
 * through the components `@theme` cascade under factory-dark and factory-light.
 *
 * Loads installed package CSS (no second visualizer palette). Also reuses the
 * Batch 1 global CSS order proof so components styles load before visualizers.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { provePackagedFactoryV002GlobalCssOrder } from "./global-css-order-proof";
import {
  extractPaletteCustomPropertyMap,
  resolveRequiredVisualizerThemeProperties,
} from "./visualizer-theme-token-resolution";
import {
  assertRequiredVisualizerThemePropertiesResolved,
  PACKAGED_FACTORY_V002_HOST_THEME_PALETTES,
  PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
  type PackagedFactoryV002HostThemePalette,
  type PackagedFactoryV002RequiredVisualizerThemeProperty,
  VisualizerThemeTokenError,
} from "./visualizer-theme-tokens";

const require = createRequire(import.meta.url);

export type VisualizerThemeResolutionByPalette = Record<
  PackagedFactoryV002HostThemePalette,
  Record<PackagedFactoryV002RequiredVisualizerThemeProperty, string>
>;

export type PackagedFactoryV002VisualizerThemeProof = {
  globalsCssPath: string;
  componentsStylesPath: string;
  visualizersStylesPath: string;
  colorPalettePresetsPath: string;
  colorRoleTokensPath: string;
  textColorRoleTokensPath: string;
  resolvedByPalette: VisualizerThemeResolutionByPalette;
};

function resolveComponentsStylesPath(): string {
  return require.resolve("@you-agent-factory/components/styles.css");
}

function resolveAdjacentStylesFile(
  componentsStylesPath: string,
  relativeName: string,
): string {
  return join(dirname(componentsStylesPath), "styles", relativeName);
}

/**
 * Confirm the visualizers stylesheet still references each required token.
 * Fail closed if a required property is absent from the installed package CSS.
 */
export function assertVisualizerStylesConsumeRequiredThemeProperties(
  visualizersCssSource: string,
  required: readonly string[] = PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
): void {
  for (const property of required) {
    const needle = `var(${property}`;
    if (!visualizersCssSource.includes(needle)) {
      throw new VisualizerThemeTokenError(
        "missing-property",
        `Installed factory-visualizers styles.css does not reference ${property}; visualizer theme contract cannot be proven.`,
      );
    }
  }
}

/**
 * Prove required visualizer theme properties resolve under light and dark
 * host palette conditions through the installed components theme CSS.
 */
export function provePackagedFactoryV002VisualizerThemeTokens(
  repoRoot: string = process.cwd(),
): PackagedFactoryV002VisualizerThemeProof {
  const cssOrder = provePackagedFactoryV002GlobalCssOrder(repoRoot);

  const componentsStylesPath = resolveComponentsStylesPath();
  const colorPalettePresetsPath = resolveAdjacentStylesFile(
    componentsStylesPath,
    "color-palette-presets.css",
  );
  const colorRoleTokensPath = resolveAdjacentStylesFile(
    componentsStylesPath,
    "color-role-tokens.css",
  );
  const textColorRoleTokensPath = resolveAdjacentStylesFile(
    componentsStylesPath,
    "text-color-role-tokens.css",
  );

  const paletteCss = readFileSync(colorPalettePresetsPath, "utf8");
  const colorRoleCss = readFileSync(colorRoleTokensPath, "utf8");
  const textColorRoleCss = readFileSync(textColorRoleTokensPath, "utf8");
  const visualizersCss = readFileSync(cssOrder.visualizersStylesPath, "utf8");

  assertVisualizerStylesConsumeRequiredThemeProperties(visualizersCss);

  const resolvedByPalette = {} as VisualizerThemeResolutionByPalette;

  for (const palette of PACKAGED_FACTORY_V002_HOST_THEME_PALETTES) {
    const foundation = extractPaletteCustomPropertyMap(paletteCss, palette);
    const resolved = resolveRequiredVisualizerThemeProperties(
      [colorRoleCss, textColorRoleCss],
      foundation,
    );
    assertRequiredVisualizerThemePropertiesResolved(resolved);
    resolvedByPalette[palette] = resolved;
  }

  // Light and dark must not collapse to identical ink / status surfaces —
  // otherwise the dual-palette proof is not exercising host theme conditions.
  const darkOnSurface = resolvedByPalette["factory-dark"]["--color-on-surface"];
  const lightOnSurface =
    resolvedByPalette["factory-light"]["--color-on-surface"];
  if (darkOnSurface.toLowerCase() === lightOnSurface.toLowerCase()) {
    throw new VisualizerThemeTokenError(
      "invalid-color",
      `Expected --color-on-surface to differ between factory-dark and factory-light (both resolved to ${darkOnSurface}).`,
    );
  }

  return {
    globalsCssPath: cssOrder.globalsCssPath,
    componentsStylesPath,
    visualizersStylesPath: cssOrder.visualizersStylesPath,
    colorPalettePresetsPath,
    colorRoleTokensPath,
    textColorRoleTokensPath,
    resolvedByPalette,
  };
}
