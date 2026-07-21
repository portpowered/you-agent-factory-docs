/**
 * Production W08 API reference theme + code-copy contract.
 *
 * Styling must resolve through host semantic tokens (shadcn → factory-dark /
 * light bindings in `globals.css`). Do not introduce a page-only hex/oklch
 * color system under `src/components/references/api/`.
 *
 * Code samples use the site `CodePanel` + fumadocs `useCopyButton` pattern
 * (same as W07 schema examples) — not a second copy widget.
 *
 * Locked Q3 accent policy: code-panel language tabs, HTTP method badges, and
 * response status chips use secondary blue for selected/emphasis and muted
 * secondary for quieter/unselected states — never primary yellow.
 */

/** Marker attribute on the production API theme root (harness or page). */
export const API_THEME_ROOT_ATTR = "data-api-reference-theme" as const;

/** Marker on CodePanel-backed example code surfaces. */
export const API_CODE_PANEL_ATTR = "data-api-code-panel" as const;

/**
 * Semantic Tailwind / utility classes that resolve through host tokens.
 * Prefer these (or equivalents like `text-foreground`) over raw colors.
 *
 * `primary` remains a host semantic alias for unrelated non-accent consumers.
 * Tabs, method badges, and status chips must use {@link API_ACCENT_TOKEN_CLASSES}
 * instead — do not wire `primary` into those accents.
 */
export const API_TOKEN_CLASSES = {
  foreground: "text-foreground",
  mutedForeground: "text-muted-foreground",
  card: "bg-card text-card-foreground",
  border: "border-border",
  /** Host primary alias — not the accent for tabs/badges/chips. */
  primary: "text-primary",
  secondary: "text-secondary",
  muted: "bg-muted",
  background: "bg-background",
  ring: "focus-visible:ring-ring",
} as const;

/**
 * Accent roles for API code-panel language tabs, HTTP method badges, and
 * response status chips under `data-api-reference-theme`.
 *
 * - Selected / emphasis → secondary blue (`text-secondary` / `border-secondary`)
 * - Quieter / unselected → muted secondary via host `muted-foreground`
 *
 * Primary yellow (`text-primary` / `text-fd-primary` / `border-fd-primary`) is
 * never the documented accent for these surfaces.
 */
export const API_ACCENT_TOKEN_CLASSES = {
  /** Selected / active / emphasis text (secondary blue). */
  selected: "text-secondary",
  /** Selected / active underline or chip border (secondary blue). */
  selectedBorder: "border-secondary",
  /** Quieter / unselected text (muted secondary via host muted-foreground). */
  quiet: "text-muted-foreground",
  /** Quieter border chrome (neutral host border — not primary). */
  quietBorder: "border-border",
} as const;

/**
 * Host CSS custom properties the accent roles resolve through.
 * Prefer these when remapping Fumadocs `fd-primary` utilities under the API
 * theme root — never page-only hex/rgb/hsl/oklch.
 */
export const API_ACCENT_CSS_VARS = {
  selected: "var(--secondary)",
  quiet: "var(--muted-foreground)",
} as const;

/**
 * Method badge tone classes — semantic tokens only. Meaning stays in the
 * uppercase method text (`ApiMethodBadge`); tones are optional chrome and
 * must not rely on color alone. Accent text uses secondary / muted-secondary
 * roles from {@link API_ACCENT_TOKEN_CLASSES}, never primary yellow.
 */
export const API_METHOD_BADGE_TONE_CLASSES = {
  get: `border-border bg-muted/60 ${API_ACCENT_TOKEN_CLASSES.selected}`,
  post: `border-border bg-muted ${API_ACCENT_TOKEN_CLASSES.selected}`,
  put: `border-border bg-background ${API_ACCENT_TOKEN_CLASSES.selected}`,
  patch: `border-border bg-background ${API_ACCENT_TOKEN_CLASSES.selected}`,
  delete: `border-border bg-muted/40 ${API_ACCENT_TOKEN_CLASSES.selected}`,
  default: `border-border bg-muted/50 ${API_ACCENT_TOKEN_CLASSES.quiet}`,
} as const;

export type ApiMethodBadgeToneKey = keyof typeof API_METHOD_BADGE_TONE_CLASSES;

/**
 * Production code-copy policy for API example panels.
 * Mirrors W07 schema examples: CodePanel surface + fumadocs useCopyButton.
 */
export const API_CODE_COPY_POLICY = {
  surface: "CodePanel",
  surfaceImport: "@/features/factory-ui/data-display",
  copyHook: "fumadocs-ui/utils/use-copy-button",
  inventsSecondCopyWidget: false,
  notes:
    "API examples render through site CodePanel with a sibling useCopyButton control. Do not invent a second copy widget or hard-code page-only colors on example chrome.",
} as const;

/**
 * Dual Shiki themes for optional createAPIPage `renderCodeBlock` / shikiOptions
 * wiring (W11). `defaultColor: false` emits CSS variables so light/dark follow
 * `html.dark` without page-only hex locks.
 */
export const API_SHIKI_OPTIONS = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
} as const;

/** Resolve method badge tone class from an HTTP method string. */
export function apiMethodBadgeToneClass(method: string): string {
  switch (method.trim().toLowerCase()) {
    case "get":
      return API_METHOD_BADGE_TONE_CLASSES.get;
    case "post":
      return API_METHOD_BADGE_TONE_CLASSES.post;
    case "put":
      return API_METHOD_BADGE_TONE_CLASSES.put;
    case "patch":
      return API_METHOD_BADGE_TONE_CLASSES.patch;
    case "delete":
      return API_METHOD_BADGE_TONE_CLASSES.delete;
    default:
      return API_METHOD_BADGE_TONE_CLASSES.default;
  }
}

/**
 * True when a class string only references semantic token utilities (no
 * hard-coded page-only hex / rgb / hsl / oklch colors).
 */
export function usesSemanticTokenClasses(className: string): boolean {
  if (/#[0-9a-fA-F]{3,8}\b/.test(className)) return false;
  if (/\brgb\(|\bhsl\(|\boklch\(/.test(className)) return false;
  return (
    className.includes("foreground") ||
    className.includes("border") ||
    className.includes("card") ||
    className.includes("primary") ||
    className.includes("secondary") ||
    className.includes("muted") ||
    className.includes("background") ||
    className.includes("ring")
  );
}

/**
 * True when a class string does not use primary yellow as an accent utility.
 * Used to fence tabs / badges / chips against `text-primary` / `border-primary`
 * regressions (Fumadocs `fd-primary` remaps land in a later story).
 */
export function avoidsPrimaryAccentClasses(className: string): boolean {
  return !/\b(?:text|border|bg|ring|decoration|outline|fill|stroke)-primary(?:\/|\b)/.test(
    className,
  );
}
