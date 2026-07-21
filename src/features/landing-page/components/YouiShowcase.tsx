import type { CSSProperties } from "react";
import { landingHomeAssets } from "@/features/landing-page/landing-page.assets";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
import { cn } from "@/lib/utils";

export type YouiShowcaseProps = {
  /**
   * Monkey background image URL.
   * Defaults to staged `landingHomeAssets.monkey` (`/home/monkey.png`).
   * Empty string omits the background without crashing.
   */
  backgroundSrc?: string;
  /**
   * Factory graph UI (foreground) image URL.
   * Defaults to staged `landingHomeAssets.factoryGraphUi`
   * (`/home/factory-graph-ui.png`).
   * Empty string omits the foreground without crashing.
   */
  graphSrc?: string;
  /**
   * Optional section title. Defaults to `fixtureLandingPageData.youi.title`.
   * Pass `""` to hide the title.
   */
  title?: string;
  /**
   * Accessible name for the foreground graph UI image.
   * Defaults to a short descriptive alt; nearby title also labels the section.
   */
  graphAlt?: string;
  /** Root className for layout / section placement. */
  className?: string;
  /** Optional inline styles for section anchoring. */
  style?: CSSProperties;
};

export const YOUI_SHOWCASE_DEFAULT_BACKGROUND_SRC = landingHomeAssets.monkey;
export const YOUI_SHOWCASE_DEFAULT_GRAPH_SRC = landingHomeAssets.factoryGraphUi;
export const YOUI_SHOWCASE_DEFAULT_TITLE = fixtureLandingPageData.youi.title;
export const YOUI_SHOWCASE_DEFAULT_GRAPH_ALT = "Factory graph UI";

/** Intrinsic pixel size of staged `monkey.png`. */
export const YOUI_SHOWCASE_MONKEY_INTRINSIC_WIDTH = 709;
export const YOUI_SHOWCASE_MONKEY_INTRINSIC_HEIGHT = 1440;

/** Intrinsic pixel size of staged `factory-graph-ui.png`. */
export const YOUI_SHOWCASE_GRAPH_INTRINSIC_WIDTH = 1286;
export const YOUI_SHOWCASE_GRAPH_INTRINSIC_HEIGHT = 1495;

/**
 * Responsive `sizes` for the full-bleed monkey background within the showcase.
 * Background fills the section host — majority of a narrow viewport, capped
 * on desktop — not an unconstrained missing/100vw-wrong default for art that
 * is still section-bounded.
 */
export const YOUI_SHOWCASE_BACKGROUND_SIZES = "(max-width: 768px) 100vw, 720px";

/**
 * Responsive `sizes` for the constrained foreground graph UI overlay.
 * Graph art sits narrower than the section on desktop.
 */
export const YOUI_SHOWCASE_GRAPH_SIZES = "(max-width: 768px) 85vw, 480px";

/**
 * Youi showcase: monkey background + factory graph UI foreground.
 *
 * Background is presentational (`aria-hidden`). Foreground graph UI carries a
 * meaningful alt (or is labeled by the nearby title). Missing optional image
 * srcs keep a stable host without crashing.
 */
export function YouiShowcase({
  backgroundSrc = YOUI_SHOWCASE_DEFAULT_BACKGROUND_SRC,
  graphSrc = YOUI_SHOWCASE_DEFAULT_GRAPH_SRC,
  title = YOUI_SHOWCASE_DEFAULT_TITLE,
  graphAlt = YOUI_SHOWCASE_DEFAULT_GRAPH_ALT,
  className,
  style,
}: YouiShowcaseProps) {
  const hasBackground =
    typeof backgroundSrc === "string" && backgroundSrc.length > 0;
  const hasGraph = typeof graphSrc === "string" && graphSrc.length > 0;
  const hasTitle = typeof title === "string" && title.length > 0;

  return (
    <section
      aria-label={hasTitle ? undefined : "Youi showcase"}
      className={cn(
        "relative isolate mx-auto w-full max-w-3xl overflow-hidden",
        className,
      )}
      data-youi-showcase=""
      style={style}
    >
      {hasBackground ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 select-none"
          data-youi-showcase-background=""
        >
          <img
            alt=""
            className="h-full w-full object-cover object-center"
            data-youi-showcase-background-image=""
            decoding="async"
            draggable={false}
            height={YOUI_SHOWCASE_MONKEY_INTRINSIC_HEIGHT}
            sizes={YOUI_SHOWCASE_BACKGROUND_SIZES}
            src={backgroundSrc}
            width={YOUI_SHOWCASE_MONKEY_INTRINSIC_WIDTH}
          />
        </div>
      ) : null}

      <div
        className="relative z-0 flex flex-col items-center gap-4 px-4 py-10 sm:px-6 sm:py-14"
        data-youi-showcase-content=""
      >
        {hasTitle ? (
          <h2
            className="m-0 text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            data-youi-showcase-title=""
          >
            {title}
          </h2>
        ) : null}

        {hasGraph ? (
          <img
            alt={graphAlt}
            className="block h-auto w-full max-w-[min(100%,30rem)]"
            data-youi-showcase-graph-image=""
            decoding="async"
            draggable={false}
            height={YOUI_SHOWCASE_GRAPH_INTRINSIC_HEIGHT}
            sizes={YOUI_SHOWCASE_GRAPH_SIZES}
            src={graphSrc}
            width={YOUI_SHOWCASE_GRAPH_INTRINSIC_WIDTH}
          />
        ) : null}
      </div>
    </section>
  );
}
