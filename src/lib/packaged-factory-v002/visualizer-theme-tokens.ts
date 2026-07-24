/**
 * Required visualizer theme custom properties for packaged-factory 0.0.2 Batch 1.
 *
 * Pure constants/helpers only. Visualizer styles consume these `--color-*`
 * tokens through the host Tailwind / components `@theme` cascade — no second
 * hard-coded visualizer palette is introduced here.
 */

/** Representative host palette attributes under which tokens must resolve. */
export const PACKAGED_FACTORY_V002_HOST_THEME_PALETTES = [
  "factory-dark",
  "factory-light",
] as const;

export type PackagedFactoryV002HostThemePalette =
  (typeof PACKAGED_FACTORY_V002_HOST_THEME_PALETTES)[number];

/**
 * Required visualizer CSS custom properties (AC minimum set).
 * Semantic status colors are the status-only roles consumed by visualizers.
 */
export const PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES = [
  "--color-on-surface",
  "--color-surface-container-low",
  "--color-outline",
  "--color-error",
  "--color-success",
  "--color-warning",
  "--color-info",
] as const;

export type PackagedFactoryV002RequiredVisualizerThemeProperty =
  (typeof PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES)[number];

export class VisualizerThemeTokenError extends Error {
  readonly code:
    | "missing-property"
    | "unresolved-property"
    | "invalid-color"
    | "missing-palette"
    | "missing-theme-declaration";

  constructor(code: VisualizerThemeTokenError["code"], message: string) {
    super(message);
    this.name = "VisualizerThemeTokenError";
    this.code = code;
  }
}

/**
 * True when a resolved CSS color is usable (non-empty hex / rgb / rgba).
 * Rejects empty, `initial`, `inherit`, `unset`, `transparent`, and bare `var()`.
 */
export function isUsableResolvedCssColorValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return false;
  }
  if (
    trimmed === "initial" ||
    trimmed === "inherit" ||
    trimmed === "unset" ||
    trimmed === "revert" ||
    trimmed === "transparent" ||
    trimmed === "currentcolor"
  ) {
    return false;
  }
  if (trimmed.includes("var(")) {
    return false;
  }
  if (/^#[0-9a-f]{6}$/i.test(trimmed) || /^#[0-9a-f]{3}$/i.test(trimmed)) {
    return true;
  }
  if (
    /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+\s*)?\)$/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Fail closed when any required visualizer theme property is missing or
 * unresolved to a usable computed color value.
 */
export function assertRequiredVisualizerThemePropertiesResolved(
  resolved: Readonly<Record<string, string>>,
  required: readonly string[] = PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
): void {
  for (const property of required) {
    if (!(property in resolved)) {
      throw new VisualizerThemeTokenError(
        "missing-property",
        `Required visualizer theme property ${property} is missing after host theme resolution.`,
      );
    }
    const value = resolved[property];
    if (value === undefined || value.trim().length === 0) {
      throw new VisualizerThemeTokenError(
        "unresolved-property",
        `Required visualizer theme property ${property} resolved to an empty value.`,
      );
    }
    if (!isUsableResolvedCssColorValue(value)) {
      throw new VisualizerThemeTokenError(
        "invalid-color",
        `Required visualizer theme property ${property} resolved to an unusable value: ${JSON.stringify(value)}.`,
      );
    }
  }
}
