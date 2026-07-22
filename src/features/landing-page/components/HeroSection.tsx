import { type CSSProperties, Fragment, type ReactNode } from "react";
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
  /** Small reference badges printed above the primary YOU wordmark. */
  badges?: readonly string[];
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
export const HERO_SECTION_DEFAULT_BADGES = ["OPEN SOURCE", "MIT LICENSE"];

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
  badges = HERO_SECTION_DEFAULT_BADGES,
  className,
  style,
}: HeroSectionProps) {
  const hasTitle = typeof title === "string" && title.length > 0;
  const hasSubtitle = typeof subtitle === "string" && subtitle.length > 0;
  const portraitNode = portrait !== undefined ? portrait : <HeroPortrait />;
  const titleLines = title.split("\n");

  return (
    <section
      aria-label={hasTitle ? undefined : "Hero"}
      className={cn(
        "relative z-20 mx-auto grid min-h-[50rem] w-full max-w-[100rem] grid-cols-1 items-center gap-2 overflow-visible px-[clamp(1rem,4vw,4rem)] pt-0 pb-0 sm:px-8 md:grid-cols-[minmax(0,1.16fr)_minmax(22rem,0.84fr)] lg:gap-4",
        className,
      )}
      data-hero-section=""
      style={style}
    >
      <div
        className="pointer-events-none absolute top-[-3%] right-[-34%] z-0 flex aspect-square w-[min(100vw,88rem)] items-center justify-center sm:right-[-28%] md:top-[-8%] md:right-[-24%]"
        data-hero-section-sphere=""
      >
        {holeOrPlaceholder(
          "sphere",
          sphere,
          HERO_SECTION_SPHERE_HOLE_MIN_HEIGHT,
        )}
      </div>

      <div
        className="relative z-20 flex min-w-0 flex-col items-start gap-4 pt-0"
        data-hero-section-copy-column=""
      >
        {hasTitle || hasSubtitle ? (
          <header
            className="w-full space-y-1 text-left"
            data-hero-section-copy=""
          >
            {badges.length > 0 ? (
              <div
                className="flex flex-wrap gap-x-5 gap-y-1 font-sans text-[0.64rem] font-semibold tracking-[-0.02em] text-[#ecece4] uppercase sm:text-xs"
                data-hero-section-badges=""
              >
                {badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            ) : null}
            {hasTitle ? (
              <h1
                className="m-0 whitespace-pre-line font-mono text-[clamp(3.8rem,8.4vw,8.5rem)] leading-[0.7] font-black tracking-[-0.09em] text-[#ecece4] uppercase"
                data-hero-section-title=""
              >
                {titleLines.map((line, index) => {
                  const highlighted = index === 0 && line.startsWith("YOU ");
                  return (
                    <Fragment key={line}>
                      <span className="block">
                        {highlighted ? (
                          <>
                            <span className="mr-[0.08em] inline-block bg-[#ecece4] px-[0.08em] text-[1.12em] text-[#191f2b]">
                              YOU
                            </span>{" "}
                            {line.slice(4)}
                          </>
                        ) : (
                          line
                        )}
                      </span>
                      {index < titleLines.length - 1 ? "\n" : null}
                    </Fragment>
                  );
                })}
              </h1>
            ) : null}
          </header>
        ) : null}

        <div
          className="flex min-h-[var(--hero-section-terminal-min,160px)] w-[min(90vw,44rem)] max-w-none items-center md:w-[min(55vw,44rem)]"
          data-hero-section-terminal=""
        >
          {holeOrPlaceholder(
            "terminal",
            terminal,
            HERO_SECTION_TERMINAL_HOLE_MIN_HEIGHT,
          )}
        </div>

        {hasSubtitle ? (
          <p
            className="m-0 max-w-[56rem] whitespace-pre-line text-[0.68rem] leading-[1.28] text-[#ecece4]/86 sm:text-xs lg:text-sm"
            data-hero-section-subtitle=""
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div
        className="relative isolate min-h-[29rem] w-full sm:min-h-[36rem] md:min-h-[48rem]"
        data-hero-section-layout=""
      >
        <div
          className="pointer-events-none absolute bottom-[-3%] left-1/2 z-10 flex w-[min(94%,38rem)] -translate-x-1/2 justify-center md:right-[-4%] md:bottom-[-6%] md:left-auto md:w-[min(112%,38rem)] md:translate-x-0"
          data-hero-section-portrait=""
        >
          {portraitNode}
        </div>
      </div>
    </section>
  );
}
