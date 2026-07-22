"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  FactorySlide,
  type FactorySlideData,
} from "@/features/landing-page/components/FactorySlide";
import {
  type LandingCarouselTheme,
  landingPageTheme,
} from "@/features/landing-page/landing-page.theme";
import { cn } from "@/lib/utils";

export type FactoryCarouselProps = {
  slides: FactorySlideData[];
  className?: string;
  /** Exact heading printed across the wide feature card. */
  eyebrow?: string;
  /** Artwork shown inside the wide feature card. */
  featureArtSrc?: string;
  /**
   * Controlled active index (0-based). When set, the carousel follows this
   * value so tests and parents can change which slide is primary.
   */
  activeIndex?: number;
  /** Uncontrolled starting index when `activeIndex` is omitted. Defaults to 0. */
  initialIndex?: number;
  /** Called when navigation (buttons, keyboard, drag) requests a new index. */
  onActiveIndexChange?: (index: number) => void;
  /** Optional theme override; defaults to landing-page carousel knobs. */
  theme?: LandingCarouselTheme;
};

export type CarouselSlideDepthRole = "active" | "neighbor" | "far";

/** Visual motion mode: animated collage vs static collage (reduced motion). */
export type CarouselMotionMode = "depth" | "static";

export type CarouselSlideDepth = {
  role: CarouselSlideDepthRole;
  scale: number;
  opacity: number;
  zIndex: number;
  /** Horizontal offset as a CSS length (e.g. `-18%`). Active is `0%`. */
  translateX: string;
};

const NEIGHBOR_OFFSET_PERCENT = 18;
const FAR_OFFSET_PERCENT = 28;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Pure depth layout for one slide relative to the active index.
 * Neighbors/far slides get reduced scale/opacity and lower z than active.
 */
export function getCarouselSlideDepth(
  index: number,
  activeIndex: number,
  theme: LandingCarouselTheme = landingPageTheme.carousel,
): CarouselSlideDepth {
  const delta = index - activeIndex;
  const distance = Math.abs(delta);

  if (distance === 0) {
    return {
      role: "active",
      scale: theme.activeScale,
      opacity: 1,
      zIndex: 30,
      translateX: "0%",
    };
  }

  const sign = delta < 0 ? -1 : 1;
  if (distance === 1) {
    return {
      role: "neighbor",
      scale: theme.neighborScale,
      opacity: theme.neighborOpacity,
      zIndex: 20,
      translateX: `${sign * NEIGHBOR_OFFSET_PERCENT}%`,
    };
  }

  return {
    role: "far",
    scale: theme.farScale,
    opacity: theme.farOpacity,
    zIndex: 10 - Math.min(distance, 9),
    translateX: `${sign * FAR_OFFSET_PERCENT}%`,
  };
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

type CarouselVisualSlot = {
  height: string;
  left: string;
  top: string;
  width: string;
  zIndex: number;
};

/**
 * The reference composition always keeps one wide feature card, the previous
 * card clipped at the left edge, and the next three cards overlapping its
 * right half. Rotating the index preserves that exact silhouette.
 */
function getCarouselVisualSlot(
  index: number,
  activeIndex: number,
  length: number,
): CarouselVisualSlot {
  const forward = (((index - activeIndex) % length) + length) % length;

  if (forward === 0) {
    return {
      height: "clamp(24rem, 52vw, 52rem)",
      left: "9%",
      top: "0",
      width: "82%",
      zIndex: 10,
    };
  }

  if (forward === length - 1) {
    return {
      height: "clamp(11rem, 21vw, 21rem)",
      left: "0.5%",
      top: "clamp(8.5rem, 19vw, 19rem)",
      width: "14.5%",
      zIndex: 20,
    };
  }

  const rightSlot = Math.min(forward - 1, 2);
  return {
    height: "clamp(11rem, 21vw, 21rem)",
    left: `${55 + rightSlot * 15}%`,
    top: "clamp(8.5rem, 19vw, 19rem)",
    width: "14.5%",
    zIndex: 20 + rightSlot,
  };
}

/**
 * Wrap active index by `delta` steps. Empty length stays at 0.
 * Preferred for demo carousels with a small fixed slide count.
 */
export function wrapCarouselIndex(
  index: number,
  length: number,
  delta: number,
): number {
  if (length <= 0) return 0;
  const normalized = ((index % length) + length) % length;
  return (((normalized + delta) % length) + length) % length;
}

type DragSession = {
  pointerId: number;
  startX: number;
};

/**
 * Factory depth carousel: active slide in the foreground, neighbors recessed
 * via scale/opacity/z. Prev/next buttons, keyboard arrows, and pointer drag
 * change the active slide (wrapping). When prefers-reduced-motion: reduce is
 * active, only the static active slide is shown (no neighbor depth travel).
 */
export function FactoryCarousel({
  slides,
  className,
  eyebrow,
  featureArtSrc,
  activeIndex: controlledActiveIndex,
  initialIndex = 0,
  onActiveIndexChange,
  theme = landingPageTheme.carousel,
}: FactoryCarouselProps) {
  const isControlled = controlledActiveIndex !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = useState(() =>
    clampIndex(initialIndex, slides.length),
  );
  const [reduceMotion, setReduceMotion] = useState(false);
  const dragRef = useRef<DragSession | null>(null);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const motionMode: CarouselMotionMode = reduceMotion ? "static" : "depth";

  const resolvedIndex =
    slides.length === 0
      ? 0
      : clampIndex(
          isControlled ? controlledActiveIndex : uncontrolledIndex,
          slides.length,
        );

  const setActiveIndex = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      const clamped = clampIndex(next, slides.length);
      if (!isControlled) {
        setUncontrolledIndex(clamped);
      }
      onActiveIndexChange?.(clamped);
    },
    [isControlled, onActiveIndexChange, slides.length],
  );

  const step = useCallback(
    (delta: number) => {
      if (slides.length === 0) return;
      setActiveIndex(wrapCarouselIndex(resolvedIndex, slides.length, delta));
    },
    [resolvedIndex, setActiveIndex, slides.length],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (slides.length === 0) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    },
    [slides.length, step],
  );

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const session = dragRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const deltaX = event.clientX - session.startX;
      const threshold = theme.dragThresholdPx;
      if (deltaX >= threshold) {
        step(-1);
      } else if (deltaX <= -threshold) {
        step(1);
      }
    },
    [step, theme.dragThresholdPx],
  );

  const onPointerCancel = useCallback((event: PointerEvent<HTMLElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    dragRef.current = null;
  }, []);

  if (slides.length === 0) {
    return (
      <section
        aria-label="Factory carousel"
        className={cn(
          "factory-carousel factory-carousel--empty relative w-full min-h-[12rem]",
          className,
        )}
        data-factory-carousel=""
        data-carousel-empty=""
      >
        <p className="sr-only">No factory slides</p>
      </section>
    );
  }

  const activeSlide = slides[resolvedIndex];
  const collageSlides = slides.map((slide, index) => {
    const depth = getCarouselSlideDepth(index, resolvedIndex, theme);
    const isActive = index === resolvedIndex;
    const visualSlot = getCarouselVisualSlot(
      index,
      resolvedIndex,
      slides.length,
    );
    const forward =
      (((index - resolvedIndex) % slides.length) + slides.length) %
      slides.length;
    const railSide = isActive
      ? "active"
      : forward === slides.length - 1
        ? "left"
        : forward === 1
          ? "right"
          : "far";
    const slideStyle: CSSProperties = {
      height: visualSlot.height,
      left: visualSlot.left,
      top: visualSlot.top,
      width: visualSlot.width,
      zIndex: visualSlot.zIndex,
      transitionProperty: "left, top, width, height, transform, opacity",
      transitionDuration: reduceMotion ? "0ms" : `${theme.transitionMs}ms`,
      transitionTimingFunction: "cubic-bezier(0.16, 0.84, 0.22, 1)",
    };

    return (
      <div
        key={slide.id}
        className={cn(
          "factory-carousel__slide pointer-events-auto absolute select-none",
        )}
        data-active={isActive ? "true" : undefined}
        data-carousel-depth={depth.role}
        data-carousel-slide={slide.id}
        data-carousel-slide-index={String(index)}
        data-carousel-slot={isActive ? "feature" : "rail"}
        data-carousel-rail-side={railSide}
        style={slideStyle}
      >
        <div
          aria-hidden={isActive ? undefined : true}
          className="h-full w-full"
          inert={isActive ? undefined : true}
        >
          <FactorySlide
            {...slide}
            backgroundArtSrc={isActive ? featureArtSrc : undefined}
            presentation={isActive ? "feature" : "rail"}
          />
        </div>
        {!isActive ? (
          <button
            aria-label={`Show ${slide.title} factory`}
            className="absolute inset-0 z-30 cursor-pointer bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f3bd3d]"
            data-carousel-select={slide.id}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ) : null}
      </div>
    );
  });

  return (
    <section
      aria-label="Factory carousel"
      aria-roledescription="carousel"
      className={cn(
        "factory-carousel relative w-full overflow-clip outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      data-factory-carousel=""
      data-carousel-active-index={String(resolvedIndex)}
      data-carousel-motion={motionMode}
      onKeyDown={onKeyDown}
      style={
        {
          "--landing-carousel-transition-ms": `${theme.transitionMs}ms`,
        } as CSSProperties
      }
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA carousel keyboard surface for ArrowLeft/ArrowRight
      tabIndex={0}
    >
      <div
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        data-carousel-status=""
      >
        Slide {resolvedIndex + 1} of {slides.length}: {activeSlide.title}
      </div>

      <div
        className="factory-carousel__track relative mx-auto min-h-[clamp(25rem,58vw,58rem)] w-full max-w-[100rem] touch-pan-y"
        data-carousel-track=""
        onPointerCancel={onPointerCancel}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {eyebrow ? (
          <p className="pointer-events-none absolute top-[clamp(0.65rem,1.5vw,1.5rem)] left-[14%] z-30 font-sans text-[clamp(2rem,5.6vw,5.6rem)] leading-none font-normal tracking-[-0.055em] text-[#191f2b] lowercase">
            {eyebrow}
          </p>
        ) : null}
        {collageSlides}
      </div>

      <fieldset
        className="relative z-50 mx-auto -mt-[clamp(3rem,6vw,6rem)] hidden w-[min(92%,80rem)] flex-wrap justify-center gap-x-5 gap-y-2 border-0 pb-12 md:flex"
        data-carousel-factory-selectors=""
      >
        <legend className="sr-only">Choose a factory</legend>
        {slides.map((slide, index) => {
          const selected = index === resolvedIndex;
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "border-b py-1 font-mono text-xs uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3bd3d]",
                selected
                  ? "border-[#f3bd3d] text-[#f3bd3d]"
                  : "border-transparent text-[#f1eee6]/60 hover:text-[#f1eee6]",
              )}
              data-carousel-factory-selector={slide.id}
              key={slide.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {slide.title}
            </button>
          );
        })}
      </fieldset>

      <div
        className="factory-carousel__controls pointer-events-none absolute inset-0 z-40"
        data-carousel-controls=""
      >
        <Button
          aria-label="Previous slide"
          className="factory-carousel__prev pointer-events-auto absolute top-1/2 left-2 size-9 -translate-y-1/2 rounded-full border-[#f1eee6]/50 bg-[#191f2b]/75 p-0 text-[#f1eee6] opacity-20 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          data-carousel-prev=""
          onClick={() => step(-1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <span aria-hidden="true">←</span>
        </Button>
        <Button
          aria-label="Next slide"
          className="factory-carousel__next pointer-events-auto absolute top-1/2 right-2 size-9 -translate-y-1/2 rounded-full border-[#f1eee6]/50 bg-[#191f2b]/75 p-0 text-[#f1eee6] opacity-20 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          data-carousel-next=""
          onClick={() => step(1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </section>
  );
}
