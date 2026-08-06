import type { CSSProperties, ReactNode } from "react";
import { LandingPlaceholder } from "@/features/landing-page/components/LandingPlaceholder";
import { MidSceneWhale } from "@/features/landing-page/components/MidSceneWhale";
import { MonkeyParade } from "@/features/landing-page/components/MonkeyParade";
import {
  type LandingPageTheme,
  landingPageTheme,
  landingThemeToCssVars,
} from "@/features/landing-page/landing-page.theme";

/** Slot contract from homepage-2 contracts.md. */
export type LandingPageSlots = {
  header?: ReactNode;
  hero?: ReactNode;
  capability?: ReactNode;
  carousel?: ReactNode;
  youi?: ReactNode;
  faq?: ReactNode;
  whaleBubbles?: ReactNode;
  cta?: ReactNode;
  footer?: ReactNode;
};

export type LandingPageProps = LandingPageSlots & {
  theme?: LandingPageTheme;
  className?: string;
  /** Full-height transparent whale plate behind the complete middle scene. */
  midSceneBackgroundSrc?: string;
  /** Painted transition layered over the whale at the top of the middle scene. */
  midSceneTransitionSrc?: string;
  /**
   * Monkey artwork for the decorative troop that travels left to right between
   * the carousel and the YOUI showcase. Omit to leave the band out entirely.
   */
  monkeyParadeSrc?: string;
};

/** Mock min-heights approximating vertical rhythm proportions. */
export const LANDING_SLOT_MIN_HEIGHTS = {
  header: 72,
  hero: 640,
  capability: 120,
  carousel: 480,
  youi: 420,
  faq: 360,
  whaleBubbles: 520,
  cta: 280,
  footer: 320,
} as const;

export const LANDING_SLOT_ORDER = [
  "header",
  "hero",
  "capability",
  "carousel",
  "youi",
  "faq",
  "whaleBubbles",
  "cta",
  "footer",
] as const satisfies ReadonlyArray<keyof LandingPageSlots>;

function slotOrPlaceholder(
  slotName: keyof LandingPageSlots,
  node: ReactNode | undefined,
): ReactNode {
  if (node !== undefined && node !== null) {
    return node;
  }

  return (
    <LandingPlaceholder
      label={slotName}
      minHeight={LANDING_SLOT_MIN_HEIGHTS[slotName]}
    />
  );
}

/**
 * Thin landing-page composer: nine optional section slots.
 * Omitted slots render labeled gray placeholders. Does not import
 * unfinished sibling feature packages.
 */
export function LandingPage({
  header,
  hero,
  capability,
  carousel,
  youi,
  faq,
  whaleBubbles,
  cta,
  footer,
  theme = landingPageTheme,
  className,
  midSceneBackgroundSrc,
  midSceneTransitionSrc,
  monkeyParadeSrc,
}: LandingPageProps) {
  const cssVars = {
    ...landingThemeToCssVars(theme),
    "--font-mono":
      '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
  } as CSSProperties;

  return (
    <div
      className={
        className ??
        "flex min-h-screen w-full flex-col overflow-x-clip bg-[#191f2b] text-[#ecece4]"
      }
      data-landing-page=""
      style={cssVars}
    >
      {slotOrPlaceholder("header", header)}
      <main className="flex w-full flex-1 flex-col" data-landing-main="">
        {slotOrPlaceholder("hero", hero)}
        {/*
         * Deliberately unpositioned in the stacking order: no `z-index`, no
         * `isolate`, no opaque fill of its own (the page root already paints
         * the same navy).
         *
         * The hero's portrait overhangs into the top of this scene and must be
         * covered by the painted transition *and nothing else*. Giving this
         * section a z-index would trap its children in a local stacking
         * context, so the whole scene — navy fill, whale, everything — would
         * sit either wholly above the hero (clipping the portrait against flat
         * navy) or wholly below it (leaving the portrait on top of the art).
         * Leaving it at `auto` lets each layer below choose its own side: the
         * whale stays under the hero, the transition rises above it.
         */}
        <section
          className="relative overflow-visible text-[#191f2b]"
          data-landing-mid-scene=""
        >
          {midSceneBackgroundSrc ? (
            <MidSceneWhale src={midSceneBackgroundSrc} />
          ) : null}
          {midSceneTransitionSrc ? (
            <img
              alt=""
              aria-hidden="true"
              // z-30: above the hero (z-20), so the sinking portrait passes
              // behind this art rather than in front of it.
              className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[clamp(48rem,110vw,110rem)] w-full object-fill object-top opacity-100"
              data-landing-mid-scene-transition=""
              decoding="async"
              src={midSceneTransitionSrc}
            />
          ) : null}
          {/*
           * Scene layers above the painted transition sit at z-40, below it at
           * z-10. The gap is where the transition (z-30) and the hero (z-20)
           * live, so this preserves the scene's own front-to-back order while
           * letting the transition rise above the hero.
           */}
          <div className="relative z-40">
            {slotOrPlaceholder("capability", capability)}
          </div>
          <div className="relative z-10">
            {slotOrPlaceholder("carousel", carousel)}
          </div>
          {monkeyParadeSrc ? (
            <div className="relative z-40">
              <MonkeyParade src={monkeyParadeSrc} />
            </div>
          ) : null}
          <div className="relative z-10">{slotOrPlaceholder("youi", youi)}</div>
          <div className="relative z-40 mx-auto w-full max-w-5xl px-5 pt-20 sm:px-8 sm:pt-28">
            {slotOrPlaceholder("faq", faq)}
          </div>
          <div className="relative z-10">
            {slotOrPlaceholder("whaleBubbles", whaleBubbles)}
          </div>
          {/*
           * The CTA used to be pulled up hard enough to sit on top of the
           * bubble cluster above it. It now clears the bubbles and only
           * overlaps the empty tail of that section.
           */}
          <div className="relative z-40 -mt-6 sm:-mt-10">
            {slotOrPlaceholder("cta", cta)}
          </div>
          <div
            aria-hidden="true"
            className="relative z-10 h-[clamp(12rem,20vw,22rem)] w-full"
            data-landing-whale-mouth-spacing=""
          />
        </section>
      </main>
      {slotOrPlaceholder("footer", footer)}
    </div>
  );
}
