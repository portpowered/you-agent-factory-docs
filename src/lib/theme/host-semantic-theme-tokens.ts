/**
 * Host shadcn semantic theme tokens mapped to
 * `@you-agent-factory/components` factory-dark foundation keys.
 *
 * `src/app/globals.css` `:root` must stay aligned with
 * {@link HOST_SEMANTIC_THEME_TOKEN_VARS}. Resolved hex values match
 * `color-palette-presets.css` `[data-color-palette="factory-dark"]`.
 */

/** Canonical factory-dark foundation hex values from the components package. */
export const FACTORY_DARK_FOUNDATION = {
  background: "#050b10",
  backgroundStart: "#090f15",
  backgroundMid: "#0c151d",
  canvas: "#050b10",
  surface: "#181f2b",
  ink: "#f7f2e8",
  overlay: "#ffffff",
  accent: "#f5c76f",
  accentStrong: "#ecbf58",
  accentInk: "#1a2228",
  secondaryAccent: "#507f8c",
  secondaryAccentInk: "#8aaeb8",
  danger: "#f05f5f",
} as const;

export type FactoryDarkFoundationKey = keyof typeof FACTORY_DARK_FOUNDATION;

/**
 * CSS custom-property names for foundation keys used by the host mapping.
 * These are defined by `@you-agent-factory/components` palette presets.
 */
export const FACTORY_DARK_FOUNDATION_CSS_VARS = {
  background: "--color-af-foundation-background",
  backgroundStart: "--color-af-foundation-background-start",
  backgroundMid: "--color-af-foundation-background-mid",
  canvas: "--color-af-foundation-canvas",
  surface: "--color-af-foundation-surface",
  ink: "--color-af-foundation-ink",
  overlay: "--color-af-foundation-overlay",
  accent: "--color-af-foundation-accent",
  accentStrong: "--color-af-foundation-accent-strong",
  accentInk: "--color-af-foundation-accent-ink",
  secondaryAccent: "--color-af-foundation-secondary-accent",
  secondaryAccentInk: "--color-af-foundation-secondary-accent-ink",
  danger: "--color-af-foundation-danger",
} as const satisfies Record<
  FactoryDarkFoundationKey,
  `--color-af-foundation-${string}`
>;

/** Host shadcn semantic token names remapped in `globals.css`. */
export const HOST_SEMANTIC_THEME_TOKEN_NAMES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export type HostSemanticThemeTokenName =
  (typeof HOST_SEMANTIC_THEME_TOKEN_NAMES)[number];

type HostTokenBinding =
  | { kind: "foundation"; key: FactoryDarkFoundationKey }
  | { kind: "overlay-alpha"; alpha: number };

/**
 * Binding from each host semantic token to a factory-dark foundation source.
 * Overlay-alpha tokens match the package outline treatment
 * (`rgb(from overlay r g b / alpha)`).
 */
export const HOST_SEMANTIC_THEME_TOKEN_BINDINGS = {
  background: { kind: "foundation", key: "background" },
  foreground: { kind: "foundation", key: "ink" },
  card: { kind: "foundation", key: "surface" },
  "card-foreground": { kind: "foundation", key: "ink" },
  popover: { kind: "foundation", key: "backgroundMid" },
  "popover-foreground": { kind: "foundation", key: "ink" },
  primary: { kind: "foundation", key: "accent" },
  "primary-foreground": { kind: "foundation", key: "accentInk" },
  secondary: { kind: "foundation", key: "secondaryAccent" },
  "secondary-foreground": { kind: "foundation", key: "canvas" },
  muted: { kind: "foundation", key: "backgroundMid" },
  "muted-foreground": { kind: "foundation", key: "secondaryAccentInk" },
  accent: { kind: "foundation", key: "accentStrong" },
  "accent-foreground": { kind: "foundation", key: "accentInk" },
  destructive: { kind: "foundation", key: "danger" },
  "destructive-foreground": { kind: "foundation", key: "canvas" },
  border: { kind: "overlay-alpha", alpha: 0.18 },
  input: { kind: "foundation", key: "surface" },
  ring: { kind: "foundation", key: "accent" },
  sidebar: { kind: "foundation", key: "backgroundStart" },
  "sidebar-foreground": { kind: "foundation", key: "ink" },
  "sidebar-primary": { kind: "foundation", key: "accent" },
  "sidebar-primary-foreground": { kind: "foundation", key: "accentInk" },
  "sidebar-accent": { kind: "foundation", key: "surface" },
  "sidebar-accent-foreground": { kind: "foundation", key: "ink" },
  "sidebar-border": { kind: "overlay-alpha", alpha: 0.18 },
  "sidebar-ring": { kind: "foundation", key: "accent" },
} as const satisfies Record<HostSemanticThemeTokenName, HostTokenBinding>;

/** CSS `var(...)` expressions written into `globals.css` `:root`. */
export const HOST_SEMANTIC_THEME_TOKEN_VARS = Object.fromEntries(
  HOST_SEMANTIC_THEME_TOKEN_NAMES.map((name) => {
    const binding = HOST_SEMANTIC_THEME_TOKEN_BINDINGS[name];
    if (binding.kind === "foundation") {
      return [
        name,
        `var(${FACTORY_DARK_FOUNDATION_CSS_VARS[binding.key]})`,
      ] as const;
    }
    return [
      name,
      `rgb(from var(${FACTORY_DARK_FOUNDATION_CSS_VARS.overlay}) r g b / ${binding.alpha})`,
    ] as const;
  }),
) as Record<HostSemanticThemeTokenName, string>;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

/**
 * Resolve host semantic tokens to concrete CSS color values for factory-dark.
 * Overlay-alpha tokens become `rgba(r, g, b, a)` for easy contrast/DOM checks.
 */
export function resolveHostSemanticThemeTokens(
  foundation: typeof FACTORY_DARK_FOUNDATION = FACTORY_DARK_FOUNDATION,
): Record<HostSemanticThemeTokenName, string> {
  const resolved = {} as Record<HostSemanticThemeTokenName, string>;

  for (const name of HOST_SEMANTIC_THEME_TOKEN_NAMES) {
    const binding = HOST_SEMANTIC_THEME_TOKEN_BINDINGS[name];
    if (binding.kind === "foundation") {
      resolved[name] = foundation[binding.key];
      continue;
    }
    const { r, g, b } = hexToRgb(foundation.overlay);
    resolved[name] = `rgba(${r}, ${g}, ${b}, ${binding.alpha})`;
  }

  return resolved;
}

/** Legacy teal/coral values that must not remain as host primary/accent. */
export const LEGACY_TEAL_CORAL_MARKERS = {
  primaryOklch: "oklch(0.59 0.07 205)",
  accentOklch: "oklch(0.74 0.105 21)",
} as const;
