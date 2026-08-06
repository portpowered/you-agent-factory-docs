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

/** Default monkeys in the band — enough to read as a troop, few enough to stay quiet. */
export const MONKEY_PARADE_DEFAULT_COUNT = 4;

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
  const monkeys = Array.from({ length: Math.max(0, count) }, (_, index) => ({
    id: `monkey-${index}`,
    // Stagger the resting positions so the troop is spread across the band.
    leftPercent: (index * 100) / Math.max(1, count),
    // Alternate depth: nearer monkeys are larger and travel further.
    depth: index % 2 === 0 ? 1 : 0.78,
  }));

  const { reduced } = useGsapMotion(ref, (element, { gsap }) => {
    const items = element.querySelectorAll<HTMLElement>("[data-monkey]");

    for (const item of items) {
      const depth = Number(item.dataset.monkeyDepth ?? "1");

      gsap.fromTo(
        item,
        { xPercent: -30 * depth },
        {
          xPercent: 130 * depth,
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
        "pointer-events-none relative h-[clamp(4rem,9vw,9rem)] w-full overflow-hidden",
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
          className="absolute bottom-0 h-full w-auto max-w-none select-none"
          data-monkey=""
          data-monkey-depth={String(monkey.depth)}
          decoding="async"
          draggable={false}
          key={monkey.id}
          src={src}
          style={{
            left: `${monkey.leftPercent}%`,
            opacity: 0.35 + monkey.depth * 0.35,
            transform: `scale(${monkey.depth})`,
            transformOrigin: "bottom center",
          }}
        />
      ))}
    </div>
  );
}
