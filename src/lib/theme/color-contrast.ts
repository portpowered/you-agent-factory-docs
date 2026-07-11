/**
 * WCAG relative-luminance / contrast-ratio helpers for behavioral theme proofs.
 * Operates on resolved CSS colors (hex or rgb/rgba), not stylesheet inventories.
 */

export type RgbColor = { r: number; g: number; b: number; a?: number };

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Parse `#rrggbb`, `rgb(...)`, or `rgba(...)` into 0–255 channels. */
export function parseCssColor(value: string): RgbColor {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length !== 6) {
      throw new Error(`Unsupported hex color: ${value}`);
    }
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgb = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgb) {
    throw new Error(`Unsupported CSS color: ${value}`);
  }
  return {
    r: Number(rgb[1]),
    g: Number(rgb[2]),
    b: Number(rgb[3]),
    a: rgb[4] === undefined ? 1 : Number(rgb[4]),
  };
}

/** WCAG 2.x relative luminance for an opaque sRGB color. */
export function relativeLuminance(color: RgbColor | string): number {
  const rgb = typeof color === "string" ? parseCssColor(color) : color;
  const r = channelToLinear(rgb.r);
  const g = channelToLinear(rgb.g);
  const b = channelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two opaque colors (higher is more readable). */
export function contrastRatio(
  foreground: RgbColor | string,
  background: RgbColor | string,
): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when contrast meets or exceeds the minimum ratio (with tiny float slack). */
export function meetsContrastRatio(
  foreground: RgbColor | string,
  background: RgbColor | string,
  minimum: number,
): boolean {
  return contrastRatio(foreground, background) + 1e-6 >= minimum;
}
