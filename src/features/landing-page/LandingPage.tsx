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
}: LandingPageProps) {
  const cssVars = landingThemeToCssVars(theme) as CSSProperties;

  return (
    <div
      className={className ?? "flex min-h-screen w-full flex-col"}
      data-landing-page=""
      style={cssVars}
    >
      {slotOrPlaceholder("header", header)}
      <main className="flex w-full flex-1 flex-col" data-landing-main="">
        {slotOrPlaceholder("hero", hero)}
        {slotOrPlaceholder("capability", capability)}
        {slotOrPlaceholder("carousel", carousel)}
        {slotOrPlaceholder("youi", youi)}
        {slotOrPlaceholder("faq", faq)}
        {slotOrPlaceholder("whaleBubbles", whaleBubbles)}
        {slotOrPlaceholder("cta", cta)}
      </main>
      {slotOrPlaceholder("footer", footer)}
    </div>
  );
}
