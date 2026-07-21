import type { CSSProperties, ReactNode } from "react";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import { cn } from "@/lib/utils";
import { HeroPortrait } from "./HeroPortrait";
import { LandingPlaceholder } from "./LandingPlaceholder";

export type HeroSectionProps = {
  /**
   * Optional portrait slot. Defaults to `<HeroPortrait />` using the staged
   * woman-head asset (fixture `portraitSrc` when present).
   * Pass a custom node when integrate wants a different portrait treatment.
   */
  portrait?: ReactNode;
  /**
   * Sphere composition hole. Pass Wave A `<ParticleSphere />` (or a harness
   * stub) at integrate time. When omitted, a labeled placeholder keeps the
   * reserved region readable — this file does not re-implement the canvas.
   */
  sphere?: ReactNode;
  /**
   * Terminal composition hole. Pass Wave A `<Terminal … />` (or a harness
   * stub) at integrate time. When omitted, a labeled placeholder keeps the
   * reserved region readable — this file does not re-implement terminal chrome.
   */
  terminal?: ReactNode;
  /**
   * Optional hero title. Defaults to `fixtureLandingPageData.hero.title`.
   * Pass `""` to hide.
   */
  title?: string;
  /**
   * Optional hero subtitle. Defaults to `fixtureLandingPageData.hero.subtitle`.
   * Pass `""` to hide.
   */
  subtitle?: string;
  /** Root className for layout / section placement. */
  className?: string;
  /** Optional inline styles for section anchoring. */
  style?: CSSProperties;
};

/** Mock min-size for the sphere hole when Wave A content is not passed. */
export const HERO_SECTION_SPHERE_HOLE_MIN_HEIGHT = 220;

/** Mock min-size for the terminal hole when Wave A content is not passed. */
export const HERO_SECTION_TERMINAL_HOLE_MIN_HEIGHT = 160;

export const HERO_SECTION_DEFAULT_TITLE = fixtureLandingPageData.hero.title;
export const HERO_SECTION_DEFAULT_SUBTITLE =
  fixtureLandingPageData.hero.subtitle;

function holeOrPlaceholder(
  holeName: "sphere" | "terminal",
  node: ReactNode | undefined,
  minHeight: number,
): ReactNode {
  if (node !== undefined && node !== null) {
    return node;
  }

  return (
    <LandingPlaceholder
      className="flex w-full items-center justify-center border border-dashed border-neutral-400 bg-neutral-100 text-neutral-600"
      label={holeName}
      minHeight={minHeight}
    />
  );
}

/**
 * Optional static hero layout chrome for integrate.
 *
 * Composes the owned portrait and leaves ReactNode holes for Wave A
 * ParticleSphere and Terminal. Omitted holes render labeled placeholders with
 * mock min-size so layout stays readable without re-owning those internals.
 */
export function HeroSection({
  portrait,
  sphere,
  terminal,
  title = HERO_SECTION_DEFAULT_TITLE,
  subtitle = HERO_SECTION_DEFAULT_SUBTITLE,
  className,
  style,
}: HeroSectionProps) {
  const hasTitle = typeof title === "string" && title.length > 0;
  const hasSubtitle = typeof subtitle === "string" && subtitle.length > 0;
  const portraitNode = portrait !== undefined ? portrait : <HeroPortrait />;

  return (
    <section
      aria-label={hasTitle ? undefined : "Hero"}
      className={cn(
        "relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14",
        className,
      )}
      data-hero-section=""
      style={style}
    >
      {hasTitle || hasSubtitle ? (
        <header
          className="space-y-2 text-center sm:text-left"
          data-hero-section-copy=""
        >
          {hasTitle ? (
            <h1
              className="m-0 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              data-hero-section-title=""
            >
              {title}
            </h1>
          ) : null}
          {hasSubtitle ? (
            <p
              className="m-0 max-w-2xl text-sm text-muted-foreground sm:text-base"
              data-hero-section-subtitle=""
            >
              {subtitle}
            </p>
          ) : null}
        </header>
      ) : null}

      <div
        className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,18rem)]"
        data-hero-section-layout=""
      >
        <div
          className="flex justify-center md:justify-start"
          data-hero-section-portrait=""
        >
          {portraitNode}
        </div>

        <div
          className="flex min-h-[var(--hero-section-sphere-min,220px)] w-full items-center justify-center"
          data-hero-section-sphere=""
        >
          {holeOrPlaceholder(
            "sphere",
            sphere,
            HERO_SECTION_SPHERE_HOLE_MIN_HEIGHT,
          )}
        </div>

        <div
          className="flex min-h-[var(--hero-section-terminal-min,160px)] w-full items-center justify-center md:col-span-2 lg:col-span-1"
          data-hero-section-terminal=""
        >
          {holeOrPlaceholder(
            "terminal",
            terminal,
            HERO_SECTION_TERMINAL_HOLE_MIN_HEIGHT,
          )}
        </div>
      </div>
    </section>
  );
}
