"use client";

import { type CSSProperties, useState } from "react";
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
   * value so tests and later nav can change which slide is primary.
   */
  activeIndex?: number;
  /** Uncontrolled starting index when `activeIndex` is omitted. Defaults to 0. */
  initialIndex?: number;
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
 * Factory depth carousel: active slide in the foreground, neighbors recessed
 * via scale/opacity/z. Navigation (drag/buttons/keyboard) lands in a later
 * story; `activeIndex` / `initialIndex` change which slide is primary.
 */
export function FactoryCarousel({
  slides,
  className,
  activeIndex: controlledActiveIndex,
  initialIndex = 0,
  theme = landingPageTheme.carousel,
}: FactoryCarouselProps) {
  // Navigation stories will introduce setActive; depth story only needs read path.
  const [uncontrolledIndex] = useState(() =>
    clampIndex(initialIndex, slides.length),
  );

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

  const resolvedIndex = clampIndex(
    controlledActiveIndex ?? uncontrolledIndex,
    slides.length,
  );

  return (
    <section
      aria-label="Factory carousel"
      aria-roledescription="carousel"
      className={cn(
        "factory-carousel relative w-full overflow-hidden",
        className,
      )}
      data-factory-carousel=""
      data-carousel-active-index={String(resolvedIndex)}
      style={
        {
          "--landing-carousel-transition-ms": `${theme.transitionMs}ms`,
        } as CSSProperties
      }
    >
      <div
        className="factory-carousel__track relative mx-auto flex min-h-[22rem] w-full max-w-3xl items-center justify-center"
        data-carousel-track=""
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
              className={cn(
                "factory-carousel__slide absolute inset-x-0 mx-auto w-[min(100%,28rem)] px-4",
                isActive ? "pointer-events-auto" : "pointer-events-none",
              )}
              data-carousel-slide={slide.id}
              data-carousel-slide-index={String(index)}
              data-carousel-depth={depth.role}
              data-active={isActive ? "true" : undefined}
              aria-hidden={isActive ? undefined : true}
              style={slideStyle}
            >
              <FactorySlide {...slide} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
