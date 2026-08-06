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
  /**
   * Milliseconds between automatic advances. `0` disables autoplay.
   *
   * Autoplay is suspended while the reader is hovering, focused inside, or
   * dragging, when the tab is hidden, and always under reduced motion.
   */
  autoPlayMs?: number;
};

/** Default dwell time on each slide before the carousel advances itself. */
export const CAROUSEL_DEFAULT_AUTOPLAY_MS = 6000;

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

/**
 * Signed distance from the active slide, taking the shorter way around.
 *
 * This is what makes the carousel rotate rather than rewind: stepping from the
 * last slide to the first is `+1`, so the track keeps travelling in the same
 * direction instead of unwinding all the way back across the frame.
 */
export function getCarouselSignedOffset(
  index: number,
  activeIndex: number,
  length: number,
): number {
  if (length <= 0) return 0;
  const forward = (((index - activeIndex) % length) + length) % length;
  return forward > length / 2 ? forward - length : forward;
}

/** Focused plate width, as a percentage of the track. Wide, like the artwork. */
export const CAROUSEL_FEATURE_WIDTH_PERCENT = 58;

export const CAROUSEL_SLIDE_HEIGHT = "clamp(20rem, 40vw, 40rem)";
export const CAROUSEL_RAIL_HEIGHT = "clamp(11rem, 22vw, 22rem)";

/** Back-compat alias for the focused plate width. */
export const CAROUSEL_SLIDE_WIDTH = `${CAROUSEL_FEATURE_WIDTH_PERCENT}%`;

export type CarouselTrackPlacement = {
  /** Centre of the slide, as a percentage of the track width. */
  centerPercent: number;
  /** Slide width, as a percentage of the track width. */
  widthPercent: number;
  /** Slide height as a CSS length. */
  height: string;
  opacity: number;
  zIndex: number;
};

/** Centre-to-centre spacing from the focused slide, per ring. */
const RING_OFFSET_PERCENT = [0, 38, 55] as const;

/**
 * Where a slide sits on the rotating track, and how wide it is there.
 *
 * The focused slide is a wide plate and the unfocused ones are narrow cards, so
 * a slide entering focus both travels and widens, and shrinks again on the way
 * out. Width and centre are the only things that change — the earlier version
 * animated the two independently through `left`/`top`/`width`/`height` per
 * named slot, which made cards appear to stretch open in place.
 */
export function getCarouselTrackPlacement(
  index: number,
  activeIndex: number,
  length: number,
): CarouselTrackPlacement {
  const offset = getCarouselSignedOffset(index, activeIndex, length);
  const distance = Math.abs(offset);
  const direction = Math.sign(offset);

  if (distance === 0) {
    return {
      centerPercent: 50,
      widthPercent: CAROUSEL_FEATURE_WIDTH_PERCENT,
      height: CAROUSEL_SLIDE_HEIGHT,
      opacity: 1,
      zIndex: 30,
    };
  }

  const ring = Math.min(distance, RING_OFFSET_PERCENT.length - 1);
  const spacing = RING_OFFSET_PERCENT[ring] ?? 55;

  return {
    centerPercent: 50 + direction * spacing,
    widthPercent: distance === 1 ? 17 : 13,
    height: CAROUSEL_RAIL_HEIGHT,
    // Beyond the second ring a slide is off-frame; parked and fully transparent
    // so it neither paints nor catches a pointer.
    opacity: distance === 1 ? 1 : distance === 2 ? 0.72 : 0,
    zIndex: distance === 1 ? 20 : 12,
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
 * How far the track follows the finger, as a fraction of the raw drag distance.
 *
 * Below 1 so the collage feels weighted rather than loose, and so a long drag
 * cannot fling cards past the frame edge.
 */
const DRAG_FOLLOW_RATIO = 0.45;

/**
 * Movement before a pointer press is treated as a drag rather than a tap.
 *
 * Under this, the press stays a click so the side cards' select buttons fire.
 */
const DRAG_ACTIVATION_PX = 6;

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
  autoPlayMs = CAROUSEL_DEFAULT_AUTOPLAY_MS,
}: FactoryCarouselProps) {
  const isControlled = controlledActiveIndex !== undefined;
  const [uncontrolledIndex, setUncontrolledIndex] = useState(() =>
    clampIndex(initialIndex, slides.length),
  );
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [autoPlaySuspended, setAutoPlaySuspended] = useState(false);
  const dragRef = useRef<DragSession | null>(null);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const motionMode: CarouselMotionMode = reduceMotion ? "static" : "depth";

  /**
   * Autoplay never runs under reduced motion, while the reader is interacting,
   * or while the tab is hidden. `setInterval` rather than rAF keeps this off
   * the animation-frame path the reduced-motion contracts assert on.
   */
  const autoPlaying =
    !reduceMotion && autoPlayMs > 0 && slides.length > 1 && !autoPlaySuspended;

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

  useEffect(() => {
    if (!autoPlaying) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      step(1);
    }, autoPlayMs);

    return () => window.clearInterval(timer);
  }, [autoPlaying, autoPlayMs, step]);

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

  /**
   * Note what was pressed, but do **not** capture the pointer yet.
   *
   * Capturing here retargets every later pointer event — including the one that
   * would have produced a `click` — at the track, so tapping a side card
   * selected nothing. Capture is deferred to the first real movement in
   * `onPointerMove`, which leaves a plain tap to reach the card's own button.
   */
  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX };
    setAutoPlaySuspended(true);
  }, []);

  /**
   * Track the finger while dragging so the collage moves with the gesture
   * instead of sitting still until release. This is what makes the surface read
   * as a carousel rather than a set of buttons that swap positions.
   */
  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const travelled = Math.abs(event.clientX - session.startX);
    if (travelled < DRAG_ACTIVATION_PX) {
      // Still within tap tolerance — leave the click path alone.
      return;
    }
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragOffsetPx((event.clientX - session.startX) * DRAG_FOLLOW_RATIO);
  }, []);

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const session = dragRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDragOffsetPx(0);
      setAutoPlaySuspended(false);
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
    setDragOffsetPx(0);
    setAutoPlaySuspended(false);
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
    const placement = getCarouselTrackPlacement(
      index,
      resolvedIndex,
      slides.length,
    );
    const offset = getCarouselSignedOffset(index, resolvedIndex, slides.length);
    const railSide = isActive ? "active" : offset < 0 ? "left" : "right";
    const slideStyle: CSSProperties = {
      height: placement.height,
      left: `${placement.centerPercent}%`,
      top: "50%",
      width: `${placement.widthPercent}%`,
      opacity: placement.opacity,
      zIndex: placement.zIndex,
      transform: "translate(-50%, -50%)",
      transitionProperty: "left, width, height, opacity",
      transitionDuration: reduceMotion ? "0ms" : `${theme.transitionMs}ms`,
      transitionTimingFunction: "cubic-bezier(0.16, 0.84, 0.22, 1)",
    };

    return (
      <div
        key={slide.id}
        className={cn(
          "factory-carousel__slide absolute select-none",
          placement.opacity === 0
            ? "pointer-events-none"
            : "pointer-events-auto",
        )}
        data-active={isActive ? "true" : undefined}
        data-carousel-depth={depth.role}
        data-carousel-slide={slide.id}
        data-carousel-slide-index={String(index)}
        data-carousel-slide-offset={String(offset)}
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
      data-carousel-autoplay={autoPlaying ? "running" : "paused"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setAutoPlaySuspended(false);
        }
      }}
      onFocus={() => setAutoPlaySuspended(true)}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setAutoPlaySuspended(true)}
      onMouseLeave={() => {
        if (!dragRef.current) {
          setAutoPlaySuspended(false);
        }
      }}
      style={
        {
          "--landing-carousel-transition-ms": `${theme.transitionMs}ms`,
        } as CSSProperties
      }
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA carousel keyboard surface for ArrowLeft/ArrowRight
      tabIndex={0}
    >
      {/*
        While auto-rotating, announcing every slide would spam screen readers
        with changes the reader did not ask for. WAI-ARIA carousel practice is
        to silence the live region during autoplay and restore it as soon as
        the reader takes control (hover, focus, drag, or a control press).
      */}
      <div
        aria-atomic="true"
        aria-live={autoPlaying ? "off" : "polite"}
        className="sr-only"
        data-carousel-status=""
      >
        Slide {resolvedIndex + 1} of {slides.length}: {activeSlide.title}
      </div>

      {/*
        In flow above the track, not layered over it. As an absolutely
        positioned overlay it sat underneath the active card, which is now
        centred and opaque, so the heading was half-swallowed by it.
      */}
      {eyebrow ? (
        <p
          className="pointer-events-none mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,4rem)] pb-[clamp(0.5rem,1.5vw,1.5rem)] font-sans text-[clamp(2rem,5.6vw,5.6rem)] leading-none font-normal tracking-[-0.055em] text-[#191f2b] lowercase"
          data-carousel-eyebrow=""
        >
          {eyebrow}
        </p>
      ) : null}

      <div
        className="factory-carousel__track relative mx-auto min-h-[clamp(24rem,46vw,46rem)] w-full max-w-[100rem] touch-pan-y"
        data-carousel-track=""
        data-carousel-dragging={dragOffsetPx !== 0 ? "true" : undefined}
        onPointerCancel={onPointerCancel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          transform:
            dragOffsetPx === 0 ? undefined : `translateX(${dragOffsetPx}px)`,
          // No transition while the finger is down: the track must track the
          // gesture 1:1, then ease back when released.
          transition:
            dragOffsetPx === 0 && !reduceMotion
              ? `transform ${theme.transitionMs}ms cubic-bezier(0.16, 0.84, 0.22, 1)`
              : "none",
        }}
      >
        {collageSlides}
      </div>

      <fieldset
        className="relative z-50 mx-auto mt-[clamp(0.5rem,1.5vw,1.5rem)] hidden w-[min(92%,80rem)] flex-wrap justify-center gap-x-5 gap-y-2 border-0 pb-12 md:flex"
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
