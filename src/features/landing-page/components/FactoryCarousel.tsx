"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
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
 * change the active slide (wrapping).
 */
export function FactoryCarousel({
  slides,
  className,
  activeIndex: controlledActiveIndex,
  initialIndex = 0,
  onActiveIndexChange,
  theme = landingPageTheme.carousel,
}: FactoryCarouselProps) {
  const isControlled = controlledActiveIndex !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = useState(() =>
    clampIndex(initialIndex, slides.length),
  );
  const dragRef = useRef<DragSession | null>(null);

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

  return (
    <section
      aria-label="Factory carousel"
      aria-roledescription="carousel"
      className={cn(
        "factory-carousel relative w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      data-factory-carousel=""
      data-carousel-active-index={String(resolvedIndex)}
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
        className="factory-carousel__track relative mx-auto flex min-h-[22rem] w-full max-w-3xl touch-pan-y items-center justify-center"
        data-carousel-track=""
        onPointerCancel={onPointerCancel}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {slides.map((slide, index) => {
          const depth = getCarouselSlideDepth(index, resolvedIndex, theme);
          const isActive = depth.role === "active";
          const slideStyle: CSSProperties = {
            transform: `translateX(${depth.translateX}) scale(${depth.scale})`,
            opacity: depth.opacity,
            zIndex: depth.zIndex,
            transitionProperty: "transform, opacity",
            transitionDuration: `${theme.transitionMs}ms`,
            transitionTimingFunction: "cubic-bezier(0.16, 0.84, 0.22, 1)",
          };

          return (
            <div
              key={slide.id}
              aria-hidden={isActive ? undefined : true}
              className={cn(
                "factory-carousel__slide absolute inset-x-0 mx-auto w-[min(100%,28rem)] px-4 select-none",
                isActive ? "pointer-events-auto" : "pointer-events-none",
              )}
              data-active={isActive ? "true" : undefined}
              data-carousel-depth={depth.role}
              data-carousel-slide={slide.id}
              data-carousel-slide-index={String(index)}
              style={slideStyle}
            >
              <FactorySlide {...slide} />
            </div>
          );
        })}
      </div>

      <div
        className="factory-carousel__controls mx-auto mt-4 flex w-full max-w-3xl items-center justify-center gap-3"
        data-carousel-controls=""
      >
        <Button
          aria-label="Previous slide"
          className="factory-carousel__prev"
          data-carousel-prev=""
          onClick={() => step(-1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          aria-label="Next slide"
          className="factory-carousel__next"
          data-carousel-next=""
          onClick={() => step(1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </section>
  );
}
