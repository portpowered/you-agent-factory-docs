"use client";

import { useState } from "react";
import {
  WHALE_BUBBLES_FIXTURE_ITEMS,
  WHALE_BUBBLES_HARNESS_SRC,
} from "../whale-bubbles.fixtures";
import { WhaleBubblesSection } from "./WhaleBubblesSection";
import {
  DEFAULT_WHALE_PLATE_THEME,
  type WhalePlateThemeKnobs,
} from "./whale-plate.theme";

/**
 * Approximate FAQ parchment panel height so the whale plate starts below the
 * first viewport and scroll is required to fire the one-shot entrance.
 */
export const WHALE_BUBBLES_FAQ_SPACER_MIN_HEIGHT = "100svh";

export type WhaleBubblesHarnessPresetId = "default" | "exaggerated";

type HarnessPreset = Partial<WhalePlateThemeKnobs> & { label: string };

/** Reviewer-observable theme presets (same knob names as whale theme). */
export const WHALE_BUBBLES_HARNESS_PRESETS: Record<
  WhaleBubblesHarnessPresetId,
  HarnessPreset
> = {
  default: {
    label: "Default (motion-whale)",
    ...DEFAULT_WHALE_PLATE_THEME,
  },
  exaggerated: {
    label: "Exaggerated (slower / heavier)",
    initialScale: 0.72,
    initialY: 72,
    durationMs: 2400,
    blurPx: 12,
    viewAmount: 0.28,
    bubbleDelayMs: 520,
    ease: DEFAULT_WHALE_PLATE_THEME.ease,
  },
};

function themeFromPreset(preset: HarnessPreset): Partial<WhalePlateThemeKnobs> {
  return {
    initialScale: preset.initialScale,
    initialY: preset.initialY,
    durationMs: preset.durationMs,
    ease: preset.ease,
    blurPx: preset.blurPx,
    viewAmount: preset.viewAmount,
    bubbleDelayMs: preset.bubbleDelayMs,
  };
}

/**
 * Dev harness body: FAQ-height spacer + WhaleBubblesSection + theme presets.
 * Mounted only from the gated `(dev)/whale-bubbles-harness` route.
 */
export function WhaleBubblesHarness() {
  const [presetId, setPresetId] =
    useState<WhaleBubblesHarnessPresetId>("default");
  const preset = WHALE_BUBBLES_HARNESS_PRESETS[presetId];
  const theme = themeFromPreset(preset);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-whale-bubbles-harness=""
      data-whale-bubbles-harness-preset={presetId}
    >
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dev harness
            </p>
            <h1 className="text-lg font-semibold">Whale + Feature Bubbles</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Scroll past the FAQ-height spacer to trigger the one-shot heavy
              grow-in. Bubbles enter after settle. Hover or focus a bubble for
              primary accent. Emulate{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                prefers-reduced-motion: reduce
              </code>{" "}
              to skip scale/Y travel.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Theme knobs</span>
            <select
              className="rounded-md border border-border bg-card px-2 py-1.5"
              data-whale-bubbles-harness-preset-select=""
              value={presetId}
              onChange={(event) =>
                setPresetId(event.target.value as WhaleBubblesHarnessPresetId)
              }
            >
              {(
                Object.entries(WHALE_BUBBLES_HARNESS_PRESETS) as Array<
                  [
                    WhaleBubblesHarnessPresetId,
                    (typeof WHALE_BUBBLES_HARNESS_PRESETS)[WhaleBubblesHarnessPresetId],
                  ]
                >
              ).map(([id, entry]) => (
                <option key={id} value={id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <dl
          className="mx-auto mt-3 grid max-w-5xl grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4"
          data-whale-bubbles-harness-knobs=""
        >
          <div>
            <dt className="inline">initialScale </dt>
            <dd className="inline font-mono text-foreground">
              {theme.initialScale}
            </dd>
          </div>
          <div>
            <dt className="inline">durationMs </dt>
            <dd className="inline font-mono text-foreground">
              {theme.durationMs}
            </dd>
          </div>
          <div>
            <dt className="inline">blurPx </dt>
            <dd className="inline font-mono text-foreground">{theme.blurPx}</dd>
          </div>
          <div>
            <dt className="inline">bubbleDelayMs </dt>
            <dd className="inline font-mono text-foreground">
              {theme.bubbleDelayMs}
            </dd>
          </div>
        </dl>
      </header>

      {/* FAQ parchment stand-in: full viewport so whale starts below fold. */}
      <div
        className="flex flex-col justify-end border-b border-border bg-muted/40 px-4 py-10"
        data-whale-bubbles-faq-spacer=""
        style={{ minHeight: WHALE_BUBBLES_FAQ_SPACER_MIN_HEIGHT }}
      >
        <div className="mx-auto w-full max-w-3xl rounded-lg border border-dashed border-border bg-card/80 p-6 shadow-sm">
          <p className="text-sm font-medium">FAQ parchment spacer</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Approximate FAQ-panel height ({WHALE_BUBBLES_FAQ_SPACER_MIN_HEIGHT}
            ). Scroll down to bring the whale section into view and fire the
            entrance once.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <WhaleBubblesSection
          items={[...WHALE_BUBBLES_FIXTURE_ITEMS]}
          theme={theme}
          whaleSrc={WHALE_BUBBLES_HARNESS_SRC}
        />
      </div>
    </div>
  );
}
