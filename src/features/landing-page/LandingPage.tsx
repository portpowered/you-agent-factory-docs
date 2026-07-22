import type { CSSProperties, ReactNode } from "react";
import { LandingPlaceholder } from "@/features/landing-page/components/LandingPlaceholder";
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
        <section
          className="relative z-10 isolate overflow-visible bg-[#191f2b] text-[#191f2b]"
          data-landing-mid-scene=""
        >
          {midSceneBackgroundSrc ? (
            <img
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-1/2 z-0 h-full w-[500%] max-w-none -translate-x-1/2 object-fill object-center opacity-95"
              data-landing-mid-scene-whale=""
              decoding="async"
              src={midSceneBackgroundSrc}
            />
          ) : null}
          {midSceneTransitionSrc ? (
            <img
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-[clamp(48rem,110vw,110rem)] w-full object-fill object-top opacity-100"
              data-landing-mid-scene-transition=""
              decoding="async"
              src={midSceneTransitionSrc}
            />
          ) : null}
          <div className="relative z-20">
            {slotOrPlaceholder("capability", capability)}
          </div>
          <div className="relative z-10">
            {slotOrPlaceholder("carousel", carousel)}
          </div>
          <div className="relative z-10">{slotOrPlaceholder("youi", youi)}</div>
          <div className="relative z-20 mx-auto w-full max-w-5xl px-5 pt-20 sm:px-8 sm:pt-28">
            {slotOrPlaceholder("faq", faq)}
          </div>
          <div className="relative z-10">
            {slotOrPlaceholder("whaleBubbles", whaleBubbles)}
          </div>
          <div className="relative z-20 -mt-24 sm:-mt-40">
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
