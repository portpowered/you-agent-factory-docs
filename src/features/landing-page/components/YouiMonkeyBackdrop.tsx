"use client";

import { useRef } from "react";
import { useGsapMotion } from "@/features/landing-page/motion/use-gsap-motion";
import { cn } from "@/lib/utils";

export type YouiMonkeyBackdropProps = {
  /** Monkey artwork URL, repeated across the troop. */
  src: string;
  /** Intrinsic width of the artwork, for layout stability. */
  width: number;
  /** Intrinsic height of the artwork, for layout stability. */
  height: number;
  /** Responsive `sizes` hint for the repeated background art. */
  sizes: string;
  className?: string;
};

/**
 * Troop positions behind the YOUI showcase.
 *
 * Named rather than indexed so the per-monkey motion offsets below read as
 * belonging to a place in the line-up instead of to an array position.
 */
export const YOUI_MONKEY_INSTANCES = [
  "far-left",
  "left",
  "center-left",
  "center",
  "center-right",
  "right",
  "far-right",
] as const;

export type YouiMonkeyInstance = (typeof YOUI_MONKEY_INSTANCES)[number];

/**
 * Animated backdrop troop behind the YOUI showcase.
 *
 * The monkeys previously rendered as a static row, which read as wallpaper
 * rather than as a crowd. Each one now sways and bobs on its own phase, and the
 * whole line drifts sideways as the reader scrolls through the section, so the
 * troop has life without pulling attention off the graph in front of it.
 *
 * Every monkey is a wrapper element carrying the GSAP transform plus an inner
 * `<img>` carrying the layout classes — including the alternating horizontal
 * flip. Splitting them keeps GSAP's inline transform from having to preserve a
 * class-driven `scaleX(-1)`, which is exactly the kind of silent clobbering
 * that turns a subtle animation into a flipped sprite.
 *
 * Purely decorative: the whole band is `aria-hidden`. Under reduced motion it
 * renders at rest with no frame scheduled.
 */
export function YouiMonkeyBackdrop({
  src,
  width,
  height,
  sizes,
  className,
}: YouiMonkeyBackdropProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { reduced } = useGsapMotion(ref, (element, { gsap }) => {
    const monkeys = element.querySelectorAll<HTMLElement>(
      "[data-youi-showcase-monkey]",
    );

    monkeys.forEach((monkey, index) => {
      // Alternate the lean direction so neighbours never move in lockstep.
      const direction = index % 2 === 0 ? 1 : -1;

      gsap.to(monkey, {
        yPercent: -1.8 - (index % 3) * 0.6,
        rotation: 0.9 * direction,
        duration: 2.4 + (index % 4) * 0.35,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        // Stagger the phase so the troop breathes rather than pulses.
        delay: index * 0.18,
      });
    });

    // Scroll-linked drift across the whole troop: the crowd ambles past as the
    // section travels through the viewport.
    gsap.fromTo(
      monkeys,
      { xPercent: -3 },
      {
        xPercent: 3,
        ease: "none",
        stagger: 0.04,
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.9,
        },
      },
    );
  });

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-[-8%] bottom-0 z-0 flex h-[70%] select-none items-end justify-center opacity-95 mix-blend-multiply",
        className,
      )}
      data-youi-showcase-background=""
      data-youi-showcase-background-motion={reduced ? "static" : "amble"}
      ref={ref}
    >
      {YOUI_MONKEY_INSTANCES.map((instance, index) => (
        <div
          className="h-full w-[22%] min-w-[10rem] origin-bottom"
          data-youi-showcase-monkey={instance}
          key={instance}
        >
          <img
            alt=""
            className={cn(
              "h-full w-full object-contain object-bottom grayscale",
              index % 2 === 1 && "-scale-x-100",
            )}
            data-youi-showcase-background-image=""
            decoding="async"
            draggable={false}
            height={height}
            sizes={sizes}
            src={src}
            width={width}
          />
        </div>
      ))}
    </div>
  );
}
