"use client";

import { useRef } from "react";
import { useGsapMotion } from "@/features/landing-page/motion/use-gsap-motion";
import { cn } from "@/lib/utils";

export type MonkeyParadeProps = {
  /** Monkey artwork URL. Repeated across the band. */
  src: string;
  /** How many monkeys travel the band. */
  count?: number;
  className?: string;
};

/**
 * Default monkeys in the band.
 *
 * Four left visible gaps between isolated sprites; a real troop needs enough
 * bodies that they overlap. The band is decorative and every monkey is the same
 * cached image, so the count costs layout work rather than bandwidth.
 */
export const MONKEY_PARADE_DEFAULT_COUNT = 40;

/**
 * How far the troop spreads, as a percentage of the band width.
 *
 * Wider than the band so the line runs off both edges — with the ends visible
 * the troop reads as a fixed row rather than a crowd passing through.
 */
const MONKEY_SPREAD_PERCENT = 128;

/** Horizontal start of the spread, so the extra width overhangs both sides. */
const MONKEY_SPREAD_ORIGIN_PERCENT = -14;

/**
 * Width of one monkey relative to the band. Larger than the per-monkey spacing
 * at the default count, which is what makes neighbours overlap.
 */
const MONKEY_WIDTH_PERCENT = 7.5;

/**
 * Decorative band of monkeys travelling left to right across the middle scene.
 *
 * Scroll-linked rather than autoplaying: the troop advances as the reader
 * scrolls, so the motion is always something the reader caused. Each monkey is
 * offset and scaled slightly differently so the band has depth instead of
 * reading as one sprite duplicated.
 *
 * Purely decorative — the whole band is `aria-hidden` and carries no text.
 * Under reduced motion the monkeys render in their resting positions with no
 * travel and no frame scheduled.
 */
export function MonkeyParade({
  src,
  count = MONKEY_PARADE_DEFAULT_COUNT,
  className,
}: MonkeyParadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const total = Math.max(0, count);
  const monkeys = Array.from({ length: total }, (_, index) => ({
    id: `monkey-${index}`,
    // Even spread across a span wider than the band, so the row overlaps
    // itself and runs off both edges.
    leftPercent:
      MONKEY_SPREAD_ORIGIN_PERCENT +
      (index * MONKEY_SPREAD_PERCENT) / Math.max(1, total),
    // Three depths rather than two: with this many bodies, a single alternation
    // reads as a repeating pattern instead of a crowd.
    depth: [1, 0.72, 0.86][index % 3] ?? 1,
    // Vertical jitter keeps the feet off one ruled line.
    bottomPercent: [0, 7, 3, 11][index % 4] ?? 0,
  }));

  const { reduced } = useGsapMotion(ref, (element, { gsap }) => {
    const items = element.querySelectorAll<HTMLElement>("[data-monkey]");

    for (const item of items) {
      const depth = Number(item.dataset.monkeyDepth ?? "1");

      // Travel is per-monkey and depth-scaled, so the near row outpaces the
      // far row and the crowd shears slightly instead of sliding as one plate.
      gsap.fromTo(
        item,
        { xPercent: -55 * depth },
        {
          xPercent: 55 * depth,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        },
      );

      // A small bob keeps the walk from looking like a flat slide.
      gsap.to(item, {
        yPercent: -6 * depth,
        duration: 1.6 + depth * 0.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }
  });

  if (monkeys.length === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        // overflow-visible: the troop enters and leaves past the band edges,
        // which a clip would cut into a hard pop-in. Horizontal spill is
        // contained by `overflow-x-clip` on the landing root.
        "pointer-events-none relative h-[clamp(7rem,15vw,15rem)] w-full overflow-visible",
        className,
      )}
      data-monkey-parade=""
      data-monkey-parade-count={String(monkeys.length)}
      data-monkey-parade-motion={reduced ? "static" : "travel"}
      ref={ref}
    >
      {monkeys.map((monkey) => (
        <img
          alt=""
          className="absolute h-full max-w-none select-none object-contain object-bottom"
          data-monkey=""
          data-monkey-depth={String(monkey.depth)}
          decoding="async"
          draggable={false}
          key={monkey.id}
          src={src}
          style={{
            bottom: `${monkey.bottomPercent}%`,
            left: `${monkey.leftPercent}%`,
            width: `${MONKEY_WIDTH_PERCENT}%`,
            opacity: 0.42 + monkey.depth * 0.34,
            transform: `scale(${monkey.depth})`,
            transformOrigin: "bottom center",
          }}
        />
      ))}
    </div>
  );
}
