"use client";

import { useRef } from "react";
import { useGsapMotion } from "@/features/landing-page/motion/use-gsap-motion";
import { cn } from "@/lib/utils";

export type MidSceneWhaleProps = {
  /** Whale plate image URL. */
  src: string;
  className?: string;
};

/**
 * Full-bleed whale behind the middle scene, with a slow scroll-linked swim.
 *
 * The wrapper keeps the layout (absolute placement, 500% width, horizontal
 * centering) and the inner image carries the motion. They are split because
 * GSAP writes an inline `transform`, which would otherwise clobber Tailwind's
 * `-translate-x-1/2` centering and snap the whale off-center.
 *
 * The `data-landing-mid-scene-whale` marker stays on the image so the static
 * export and existing assertions see the same element as the plain `<img>` this
 * replaced. Motion is applied only after {@link useGsapMotion} confirms it is
 * allowed — under reduced motion this renders at rest with no frame scheduled.
 */
export function MidSceneWhale({ src, className }: MidSceneWhaleProps) {
  const ref = useRef<HTMLImageElement>(null);

  const { reduced } = useGsapMotion(ref, (element, { gsap }) => {
    // Gentle continuous swim: long and shallow, so the whale reads as alive
    // without competing with the copy layered above it.
    gsap.to(element, {
      xPercent: 1.6,
      yPercent: -1.2,
      duration: 9,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Scroll-linked parallax: the whale rises slightly slower than the page, so
    // the middle scene gains depth as the reader travels through it.
    gsap.fromTo(
      element,
      { y: 0 },
      {
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: element.parentElement ?? element,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      },
    );
  });

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-1/2 z-0 h-full w-[500%] max-w-none -translate-x-1/2 overflow-hidden",
        className,
      )}
      data-landing-mid-scene-whale-frame=""
    >
      <img
        alt=""
        aria-hidden="true"
        className="h-full w-full object-fill object-center opacity-95"
        data-landing-mid-scene-whale=""
        data-whale-motion={reduced ? "static" : "swim"}
        decoding="async"
        ref={ref}
        src={src}
      />
    </div>
  );
}
