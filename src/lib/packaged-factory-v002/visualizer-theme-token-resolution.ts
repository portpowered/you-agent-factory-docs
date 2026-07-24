/**
 * Pure CSS custom-property extraction and resolution for visualizer theme tokens.
 *
 * Resolves `@theme` role-token declarations against a palette foundation map
 * (including `var()` and `rgb(from … / alpha)` relative color forms used by
 * `@you-agent-factory/components`). No filesystem IO.
 */

import {
  PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
  type PackagedFactoryV002HostThemePalette,
  type PackagedFactoryV002RequiredVisualizerThemeProperty,
  VisualizerThemeTokenError,
} from "./visualizer-theme-tokens";

/** Flatten whitespace inside a CSS declaration value for matching. */
export function normalizeCssDeclarationValue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Extract `--name: value;` custom-property declarations from a CSS source.
 * Later declarations overwrite earlier ones (cascade-friendly for flat maps).
 */
export function extractCssCustomPropertyMap(
  cssSource: string,
): Map<string, string> {
  const map = new Map<string, string>();
  const pattern = /(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g;
  for (const match of cssSource.matchAll(pattern)) {
    const name = match[1];
    const value = match[2];
    if (name === undefined || value === undefined) {
      continue;
    }
    map.set(name, normalizeCssDeclarationValue(value));
  }
  return map;
}

/**
 * Extract foundation custom properties from a palette preset block whose
 * selector includes `[data-color-palette="<palette>"]`.
 */
export function extractPaletteCustomPropertyMap(
  cssSource: string,
  palette: PackagedFactoryV002HostThemePalette,
): Map<string, string> {
  const marker = `[data-color-palette="${palette}"]`;
  const blockPattern = /([^{}@]+)\{([^{}]*)\}/g;
  const result = new Map<string, string>();
  let found = false;

  for (const match of cssSource.matchAll(blockPattern)) {
    const selector = match[1] ?? "";
    const body = match[2] ?? "";
    if (!selector.includes(marker)) {
      continue;
    }
    found = true;
    for (const [name, value] of extractCssCustomPropertyMap(body)) {
      result.set(name, value);
    }
  }

  if (!found || result.size === 0) {
    throw new VisualizerThemeTokenError(
      "missing-palette",
      `Palette preset for data-color-palette="${palette}" was not found or declared no custom properties.`,
    );
  }

  return result;
}

function hexToRgbChannels(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new VisualizerThemeTokenError(
      "invalid-color",
      `Expected #rrggbb foundation color, got: ${hex}`,
    );
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

/**
 * Resolve a single CSS custom-property value against declaration maps.
 * Supports `#rrggbb`, `var(--name)`, and `rgb(from var(--name) r g b / a)`.
 */
export function resolveCssCustomPropertyValue(
  propertyName: string,
  roleDeclarations: ReadonlyMap<string, string>,
  foundationDeclarations: ReadonlyMap<string, string>,
  depth = 0,
): string {
  if (depth > 24) {
    throw new VisualizerThemeTokenError(
      "unresolved-property",
      `CSS custom property ${propertyName} exceeded resolution depth (cycle or too deep).`,
    );
  }

  const raw =
    roleDeclarations.get(propertyName) ??
    foundationDeclarations.get(propertyName);
  if (raw === undefined) {
    throw new VisualizerThemeTokenError(
      "missing-theme-declaration",
      `Theme declaration for ${propertyName} is missing from components role/palette tokens.`,
    );
  }

  return resolveCssExpression(
    raw,
    roleDeclarations,
    foundationDeclarations,
    depth,
  );
}

function resolveCssExpression(
  expression: string,
  roleDeclarations: ReadonlyMap<string, string>,
  foundationDeclarations: ReadonlyMap<string, string>,
  depth: number,
): string {
  const value = normalizeCssDeclarationValue(expression);

  if (/^#[0-9a-fA-F]{6}$/.test(value) || /^#[0-9a-fA-F]{3}$/.test(value)) {
    return value.toLowerCase();
  }

  if (
    /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+\s*)?\)$/i.test(
      value,
    )
  ) {
    return value.toLowerCase().replace(/\s+/g, "");
  }

  const relativeRgb = value.match(
    /^rgb\(\s*from\s+var\(\s*(--[A-Za-z0-9-]+)\s*\)\s+r\s+g\s+b\s*\/\s*([\d.]+)\s*\)$/i,
  );
  if (relativeRgb) {
    const sourceProperty = relativeRgb[1];
    const alphaRaw = relativeRgb[2];
    if (sourceProperty === undefined || alphaRaw === undefined) {
      throw new VisualizerThemeTokenError(
        "invalid-color",
        `Malformed relative rgb() expression: ${value}`,
      );
    }
    const source = resolveCssCustomPropertyValue(
      sourceProperty,
      roleDeclarations,
      foundationDeclarations,
      depth + 1,
    );
    const { r, g, b } = hexToRgbChannels(source);
    const alpha = Number(alphaRaw);
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      throw new VisualizerThemeTokenError(
        "invalid-color",
        `Invalid alpha in relative rgb() for ${sourceProperty}: ${alphaRaw}`,
      );
    }
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const simpleVar = value.match(/^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/i);
  if (simpleVar?.[1] !== undefined) {
    return resolveCssCustomPropertyValue(
      simpleVar[1],
      roleDeclarations,
      foundationDeclarations,
      depth + 1,
    );
  }

  throw new VisualizerThemeTokenError(
    "unresolved-property",
    `Unsupported or unresolved CSS expression: ${JSON.stringify(value)}`,
  );
}

/**
 * Resolve all required visualizer theme properties against role + foundation maps.
 */
export function resolveRequiredVisualizerThemeProperties(
  roleTokenCssSources: readonly string[],
  foundationDeclarations: ReadonlyMap<string, string>,
  required: readonly PackagedFactoryV002RequiredVisualizerThemeProperty[] = PACKAGED_FACTORY_V002_REQUIRED_VISUALIZER_THEME_PROPERTIES,
): Record<PackagedFactoryV002RequiredVisualizerThemeProperty, string> {
  const roleDeclarations = new Map<string, string>();
  for (const source of roleTokenCssSources) {
    for (const [name, value] of extractCssCustomPropertyMap(source)) {
      roleDeclarations.set(name, value);
    }
  }

  const resolved = {} as Record<
    PackagedFactoryV002RequiredVisualizerThemeProperty,
    string
  >;

  for (const property of required) {
    resolved[property] = resolveCssCustomPropertyValue(
      property,
      roleDeclarations,
      foundationDeclarations,
    );
  }

  return resolved;
}
