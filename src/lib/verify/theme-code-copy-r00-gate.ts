/**
 * R00 theme + code-copy gate probes for a code-heavy docs page.
 *
 * Pure helpers stay usable from happy-dom unit tests; the browser evaluator is
 * self-contained for Playwright `page.evaluate`.
 */

import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";

/** Representative code-heavy guide used by the R00 lane gate. */
export const THEME_CODE_COPY_R00_ROUTE =
  "/docs/guides/getting-started" as const;

/** Desktop / laptop viewport for the R00 gate. */
export const THEME_CODE_COPY_R00_DESKTOP_VIEWPORT = {
  id: "laptop",
  width: 1024,
  height: 768,
} as const;

/** Narrow / mobile viewport for the R00 gate. */
export const THEME_CODE_COPY_R00_NARROW_VIEWPORT = {
  id: "mobile",
  width: 390,
  height: 844,
} as const;

/** Expected factory-dark palette attribute on the document root. */
export const THEME_CODE_COPY_R00_PALETTE_ATTR = "factory-dark" as const;

/**
 * Concrete factory-dark RGB proofs (host semantic tokens → foundation hex).
 * Used by browser probes that read `getComputedStyle` rgb() strings.
 */
export const THEME_CODE_COPY_R00_FACTORY_DARK_RGB = {
  background: hexToRgbTuple(FACTORY_DARK_FOUNDATION.background),
  primary: hexToRgbTuple(FACTORY_DARK_FOUNDATION.accent),
  secondary: hexToRgbTuple(FACTORY_DARK_FOUNDATION.secondaryAccent),
} as const;

export type RgbTuple = readonly [number, number, number];

/** Parse `#rrggbb` into an RGB tuple. */
export function hexToRgbTuple(hex: string): RgbTuple {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected #rrggbb hex, got: ${hex}`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ] as const;
}

/**
 * Parse a CSS color string (`rgb()`, `rgba()`, or `#rrggbb`) into an RGB tuple.
 * Returns null when the value cannot be parsed.
 */
export function parseCssColorToRgb(value: string): RgbTuple | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "transparent") {
    return null;
  }

  if (trimmed.startsWith("#")) {
    try {
      return hexToRgbTuple(trimmed);
    } catch {
      return null;
    }
  }

  const match = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i,
  );
  if (!match) {
    return null;
  }

  return [
    Math.round(Number.parseFloat(match[1] ?? "0")),
    Math.round(Number.parseFloat(match[2] ?? "0")),
    Math.round(Number.parseFloat(match[3] ?? "0")),
  ] as const;
}

/** True when two RGB tuples match within a small channel tolerance. */
export function rgbTuplesMatch(
  actual: RgbTuple,
  expected: RgbTuple,
  tolerance = 2,
): boolean {
  return (
    Math.abs(actual[0] - expected[0]) <= tolerance &&
    Math.abs(actual[1] - expected[1]) <= tolerance &&
    Math.abs(actual[2] - expected[2]) <= tolerance
  );
}

export type ThemeCodeCopyR00ChromeProbe = {
  colorPalette: string | null;
  backgroundRgb: RgbTuple | null;
  primaryRgb: RgbTuple | null;
  secondaryRgb: RgbTuple | null;
  matchesFactoryDark: boolean;
};

/**
 * Probe document-root semantic chrome for factory-dark black/yellow branding.
 */
export function probeThemeCodeCopyR00Chrome(
  root: HTMLElement,
  getVar: (name: string) => string,
): ThemeCodeCopyR00ChromeProbe {
  const colorPalette = root.getAttribute("data-color-palette");
  const backgroundRgb = parseCssColorToRgb(getVar("--background"));
  const primaryRgb = parseCssColorToRgb(getVar("--primary"));
  const secondaryRgb = parseCssColorToRgb(getVar("--secondary"));

  const matchesFactoryDark =
    colorPalette === THEME_CODE_COPY_R00_PALETTE_ATTR &&
    backgroundRgb !== null &&
    primaryRgb !== null &&
    secondaryRgb !== null &&
    rgbTuplesMatch(
      backgroundRgb,
      THEME_CODE_COPY_R00_FACTORY_DARK_RGB.background,
    ) &&
    rgbTuplesMatch(primaryRgb, THEME_CODE_COPY_R00_FACTORY_DARK_RGB.primary) &&
    rgbTuplesMatch(
      secondaryRgb,
      THEME_CODE_COPY_R00_FACTORY_DARK_RGB.secondary,
    );

  return {
    colorPalette,
    backgroundRgb,
    primaryRgb,
    secondaryRgb,
    matchesFactoryDark,
  };
}

export type ThemeCodeCopyR00BlockProbe = {
  railCount: number;
  copyControlCount: number;
  firstInsetInlineStartPx: number;
  firstInsetInlineEndPx: number;
  firstCopyOpacity: number;
  firstCopyOutsideViewport: boolean;
  firstRailOutsideViewport: boolean;
};

/**
 * Probe shared DocsCodeBlock layout markers: rails, inset, persistent copy,
 * and non-overlapping scroll geometry.
 */
export function probeThemeCodeCopyR00Blocks(
  root: ParentNode = document,
): ThemeCodeCopyR00BlockProbe {
  const rails = root.querySelectorAll('[data-docs-code-actions="rail"]');
  const controls = root.querySelectorAll('[data-docs-code-copy="control"]');
  const firstFigure =
    root.querySelector("figure.docs-code-block") ??
    root.querySelector(".docs-code-block");
  const viewport = firstFigure?.querySelector(
    '[data-rich-content-scroll="code"]',
  ) as HTMLElement | null;
  const rail = firstFigure?.querySelector(
    '[data-docs-code-actions="rail"]',
  ) as HTMLElement | null;
  const control = firstFigure?.querySelector(
    '[data-docs-code-copy="control"]',
  ) as HTMLElement | null;

  let firstInsetInlineStartPx = 0;
  let firstInsetInlineEndPx = 0;
  let firstCopyOpacity = 0;
  if (viewport && typeof getComputedStyle === "function") {
    const style = getComputedStyle(viewport);
    firstInsetInlineStartPx = Number.parseFloat(style.paddingInlineStart) || 0;
    firstInsetInlineEndPx = Number.parseFloat(style.paddingInlineEnd) || 0;
  }
  if (control && typeof getComputedStyle === "function") {
    firstCopyOpacity =
      Number.parseFloat(getComputedStyle(control).opacity) || 0;
  }

  const firstCopyOutsideViewport = Boolean(
    viewport &&
      control &&
      !viewport.contains(control) &&
      rail?.contains(control),
  );
  const firstRailOutsideViewport = Boolean(
    viewport && rail && !viewport.contains(rail),
  );

  return {
    railCount: rails.length,
    copyControlCount: controls.length,
    firstInsetInlineStartPx,
    firstInsetInlineEndPx,
    firstCopyOpacity,
    firstCopyOutsideViewport,
    firstRailOutsideViewport,
  };
}

export type ThemeCodeCopyR00BrowserSnapshot = {
  chrome: ThemeCodeCopyR00ChromeProbe;
  blocks: ThemeCodeCopyR00BlockProbe;
};

/**
 * Self-contained Playwright evaluator for the R00 theme + code-copy chrome
 * and layout snapshot (no closed-over imports).
 */
export function evaluateThemeCodeCopyR00SnapshotInBrowser(expected: {
  palette: string;
  background: RgbTuple;
  primary: RgbTuple;
  secondary: RgbTuple;
}): ThemeCodeCopyR00BrowserSnapshot {
  const parseCssColorToRgb = (
    value: string,
  ): [number, number, number] | null => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "transparent") {
      return null;
    }
    if (trimmed.startsWith("#")) {
      const normalized = trimmed.replace(/^#/, "");
      if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return null;
      }
      return [
        Number.parseInt(normalized.slice(0, 2), 16),
        Number.parseInt(normalized.slice(2, 4), 16),
        Number.parseInt(normalized.slice(4, 6), 16),
      ];
    }
    const match = trimmed.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i,
    );
    if (!match) {
      return null;
    }
    return [
      Math.round(Number.parseFloat(match[1] ?? "0")),
      Math.round(Number.parseFloat(match[2] ?? "0")),
      Math.round(Number.parseFloat(match[3] ?? "0")),
    ];
  };

  const rgbTuplesMatch = (
    actual: [number, number, number],
    expectedRgb: readonly [number, number, number],
    tolerance = 2,
  ): boolean =>
    Math.abs(actual[0] - expectedRgb[0]) <= tolerance &&
    Math.abs(actual[1] - expectedRgb[1]) <= tolerance &&
    Math.abs(actual[2] - expectedRgb[2]) <= tolerance;

  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const backgroundRgb = parseCssColorToRgb(
    styles.getPropertyValue("--background"),
  );
  const primaryRgb = parseCssColorToRgb(styles.getPropertyValue("--primary"));
  const secondaryRgb = parseCssColorToRgb(
    styles.getPropertyValue("--secondary"),
  );
  const colorPalette = root.getAttribute("data-color-palette");

  const chrome = {
    colorPalette,
    backgroundRgb,
    primaryRgb,
    secondaryRgb,
    matchesFactoryDark:
      colorPalette === expected.palette &&
      backgroundRgb !== null &&
      primaryRgb !== null &&
      secondaryRgb !== null &&
      rgbTuplesMatch(backgroundRgb, expected.background) &&
      rgbTuplesMatch(primaryRgb, expected.primary) &&
      rgbTuplesMatch(secondaryRgb, expected.secondary),
  };

  const rails = document.querySelectorAll('[data-docs-code-actions="rail"]');
  const controls = document.querySelectorAll('[data-docs-code-copy="control"]');
  const firstFigure =
    document.querySelector("figure.docs-code-block") ??
    document.querySelector(".docs-code-block");
  const viewport = firstFigure?.querySelector(
    '[data-rich-content-scroll="code"]',
  ) as HTMLElement | null;
  const rail = firstFigure?.querySelector(
    '[data-docs-code-actions="rail"]',
  ) as HTMLElement | null;
  const control = firstFigure?.querySelector(
    '[data-docs-code-copy="control"]',
  ) as HTMLElement | null;

  let firstInsetInlineStartPx = 0;
  let firstInsetInlineEndPx = 0;
  let firstCopyOpacity = 0;
  if (viewport) {
    const style = getComputedStyle(viewport);
    firstInsetInlineStartPx = Number.parseFloat(style.paddingInlineStart) || 0;
    firstInsetInlineEndPx = Number.parseFloat(style.paddingInlineEnd) || 0;
  }
  if (control) {
    firstCopyOpacity =
      Number.parseFloat(getComputedStyle(control).opacity) || 0;
  }

  return {
    chrome,
    blocks: {
      railCount: rails.length,
      copyControlCount: controls.length,
      firstInsetInlineStartPx,
      firstInsetInlineEndPx,
      firstCopyOpacity,
      firstCopyOutsideViewport: Boolean(
        viewport &&
          control &&
          !viewport.contains(control) &&
          rail?.contains(control),
      ),
      firstRailOutsideViewport: Boolean(
        viewport && rail && !viewport.contains(rail),
      ),
    },
  };
}

/**
 * Self-contained Playwright evaluator: read computed color of the first copy
 * control (rest / after hover or focus styling has settled).
 */
export function evaluateThemeCodeCopyControlColorInBrowser(): {
  colorRgb: RgbTuple | null;
  opacity: number;
  ariaLabel: string | null;
  checked: boolean;
  hasCheckIcon: boolean;
} {
  const parseCssColorToRgb = (
    value: string,
  ): [number, number, number] | null => {
    const trimmed = value.trim();
    const match = trimmed.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i,
    );
    if (!match) {
      return null;
    }
    return [
      Math.round(Number.parseFloat(match[1] ?? "0")),
      Math.round(Number.parseFloat(match[2] ?? "0")),
      Math.round(Number.parseFloat(match[3] ?? "0")),
    ];
  };

  const control = document.querySelector(
    '[data-docs-code-copy="control"]',
  ) as HTMLElement | null;
  if (!control) {
    return {
      colorRgb: null,
      opacity: 0,
      ariaLabel: null,
      checked: false,
      hasCheckIcon: false,
    };
  }

  const style = getComputedStyle(control);
  return {
    colorRgb: parseCssColorToRgb(style.color),
    opacity: Number.parseFloat(style.opacity) || 0,
    ariaLabel: control.getAttribute("aria-label"),
    checked: control.getAttribute("data-checked") === "true",
    hasCheckIcon: Boolean(
      control.querySelector('[data-docs-code-copy-icon="check"]'),
    ),
  };
}
