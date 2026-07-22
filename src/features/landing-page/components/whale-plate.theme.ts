/**
 * Local theme knobs for WhalePlate (W-whale-bubbles).
 *
 * Prefer reading landing-page.theme.ts whale defaults when that file exists;
 * until then these colocated defaults match docs/temp/homepage-2/motion-whale.md.
 * Do not invent content/message schemas here.
 */

export type WhaleCubicBezier = readonly [number, number, number, number];

export type WhalePlateThemeKnobs = {
  /** Scale floor when first seen (heavy mass, not spawn-from-zero). */
  initialScale: number;
  /** Positive Y offset (px) that settles upward into rest. */
  initialY: number;
  /** Primary scale-channel duration in milliseconds. */
  durationMs: number;
  /** Heavy cubic easing for scale (slow accelerate, long decelerate). */
  ease: WhaleCubicBezier;
  /** Initial blur in px; resolves before scale finishes. */
  blurPx: number;
  /** Fraction of the plate visible before one-shot entrance fires. */
  viewAmount: number;
  /** Delay after whale settle before bubbles enter (consumed by later stories). */
  bubbleDelayMs: number;
};

/** motion-whale.md / landing-page.theme.ts whale defaults. */
export const DEFAULT_WHALE_PLATE_THEME = {
  initialScale: 0.88,
  initialY: 28,
  durationMs: 1600,
  ease: [0.16, 0.84, 0.22, 1] as const satisfies WhaleCubicBezier,
  blurPx: 2,
  viewAmount: 0.3,
  bubbleDelayMs: 280,
} as const satisfies WhalePlateThemeKnobs;

/** Default public asset path preferred by the PRD / fixture data. */
export const WHALE_PLATE_DEFAULT_SRC = "/home/mid-end-whale.png";

/** Initial opacity when first seen (motion-whale recipe; not a separate schema). */
export const WHALE_PLATE_INITIAL_OPACITY = 0.78;

export function resolveWhalePlateTheme(
  overrides?: Partial<WhalePlateThemeKnobs>,
): WhalePlateThemeKnobs {
  const initialScale = clamp(
    overrides?.initialScale ?? DEFAULT_WHALE_PLATE_THEME.initialScale,
    0.5,
    1,
  );
  const initialY = Math.max(
    0,
    overrides?.initialY ?? DEFAULT_WHALE_PLATE_THEME.initialY,
  );
  const durationMs = Math.max(
    1,
    Math.floor(overrides?.durationMs ?? DEFAULT_WHALE_PLATE_THEME.durationMs),
  );
  const ease = overrides?.ease ?? DEFAULT_WHALE_PLATE_THEME.ease;
  const blurPx = Math.max(
    0,
    overrides?.blurPx ?? DEFAULT_WHALE_PLATE_THEME.blurPx,
  );
  const viewAmount = clamp(
    overrides?.viewAmount ?? DEFAULT_WHALE_PLATE_THEME.viewAmount,
    0.05,
    1,
  );
  const bubbleDelayMs = Math.max(
    0,
    Math.floor(
      overrides?.bubbleDelayMs ?? DEFAULT_WHALE_PLATE_THEME.bubbleDelayMs,
    ),
  );

  return {
    initialScale,
    initialY,
    durationMs,
    ease,
    blurPx,
    viewAmount,
    bubbleDelayMs,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** CSS cubic-bezier() string from theme ease tuple. */
export function whaleEaseToCss(ease: WhaleCubicBezier): string {
  return `cubic-bezier(${ease[0]}, ${ease[1]}, ${ease[2]}, ${ease[3]})`;
}
