"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_WHALE_PLATE_THEME } from "./whale-plate.theme";

/** Fixture-friendly bubble item — component prop types only, no CMS schema. */
export type FeatureBubbleItem = {
  id: string;
  label: string;
  /** When set, bubble is a focusable link with keyboard primary treatment. */
  href?: string;
};

export type FeatureBubblesProps = {
  items: FeatureBubbleItem[];
  className?: string;
  /**
   * When true, the whale has settled and the enter delay may start.
   * Section orchestration sets this from WhalePlate `onSettle`.
   */
  armed?: boolean;
  /**
   * Delay after `armed` before bubbles enter (motion-whale.md ~200–400ms).
   * Defaults to whale theme `bubbleDelayMs`.
   */
  delayMs?: number;
};

type EnterPhase = "waiting" | "visible";

/** Soft floater offsets — readable above/around a whale plate. */
const BUBBLE_LAYOUT: ReadonlyArray<{ top: string; left: string }> = [
  { top: "6%", left: "10%" },
  { top: "18%", left: "62%" },
  { top: "48%", left: "8%" },
  { top: "58%", left: "55%" },
  { top: "28%", left: "38%" },
  { top: "72%", left: "28%" },
];

const DEFAULT_BUBBLE_CLASSES =
  "border-border bg-card/90 text-foreground shadow-sm";
const PRIMARY_BUBBLE_CLASSES =
  "border-primary bg-primary text-primary-foreground shadow-md";

const BUBBLE_ENTER_MS = 480;
const BUBBLE_TRAVEL_Y_PX = 14;

/**
 * Feature bubble cluster for the mid→end whale plate.
 * Delayed enter after whale settle; hover/focus → primary accent.
 */
export function FeatureBubbles({
  items,
  className,
  armed = false,
  delayMs = DEFAULT_WHALE_PLATE_THEME.bubbleDelayMs,
}: FeatureBubblesProps) {
  const [phase, setPhase] = useState<EnterPhase>("waiting");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [primaryId, setPrimaryId] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Bubbles do not enter in lockstep with the whale — wait for armed + delay.
  useEffect(() => {
    if (!armed) {
      setPhase("waiting");
      return;
    }

    const waitMs = Math.max(0, Math.floor(delayMs));
    if (waitMs === 0) {
      setPhase("visible");
      return;
    }

    const timer = window.setTimeout(() => {
      setPhase("visible");
    }, waitMs);

    return () => window.clearTimeout(timer);
  }, [armed, delayMs]);

  const show = phase === "visible";

  return (
    <div
      className={cn(
        "pointer-events-none relative min-h-[12rem] w-full",
        className,
      )}
      data-feature-bubbles=""
      data-feature-bubbles-armed={armed ? "true" : "false"}
      data-feature-bubbles-delay-ms={String(Math.max(0, Math.floor(delayMs)))}
      data-feature-bubbles-phase={show ? "visible" : "waiting"}
      data-feature-bubbles-count={String(items.length)}
    >
      {items.map((item, index) => {
        const layout = BUBBLE_LAYOUT[index % BUBBLE_LAYOUT.length];
        const isPrimary = primaryId === item.id;
        const interactive = Boolean(item.href);
        // Reduced motion: fade only — no Y travel (motion-whale.md).
        const offsetY = show || reduceMotion ? 0 : BUBBLE_TRAVEL_Y_PX;

        const style: CSSProperties = {
          top: layout.top,
          left: layout.left,
          opacity: show ? 1 : 0,
          transform: `translateY(${offsetY}px)`,
          transition: reduceMotion
            ? `opacity ${BUBBLE_ENTER_MS}ms ease-out`
            : [
                `opacity ${BUBBLE_ENTER_MS}ms ease-out`,
                `transform ${BUBBLE_ENTER_MS}ms cubic-bezier(0.22, 0.9, 0.2, 1)`,
              ].join(", "),
          transitionDelay: show ? `${Math.min(index * 40, 160)}ms` : "0ms",
        };

        const bubbleClassName = cn(
          "pointer-events-auto absolute inline-flex max-w-[11rem] items-center justify-center rounded-full border px-3 py-1.5 text-center text-sm font-medium transition-colors",
          isPrimary ? PRIMARY_BUBBLE_CLASSES : DEFAULT_BUBBLE_CLASSES,
          interactive &&
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        );

        const commonProps = {
          "data-feature-bubble": "",
          "data-feature-bubble-id": item.id,
          "data-feature-bubble-primary": isPrimary ? "true" : "false",
          className: bubbleClassName,
          style,
          onMouseEnter: () => setPrimaryId(item.id),
          onMouseLeave: (event: MouseEvent<HTMLElement>) => {
            // Keep primary if focus moved into the same bubble.
            if (
              interactive &&
              event.currentTarget.contains(document.activeElement)
            ) {
              return;
            }
            setPrimaryId((current) => (current === item.id ? null : current));
          },
        };

        if (item.href) {
          return (
            <a
              key={item.id}
              {...commonProps}
              href={item.href}
              onBlur={() =>
                setPrimaryId((current) =>
                  current === item.id ? null : current,
                )
              }
              onFocus={() => setPrimaryId(item.id)}
              onKeyDown={(event: KeyboardEvent<HTMLAnchorElement>) => {
                if (event.key === "Escape") {
                  (event.currentTarget as HTMLAnchorElement).blur();
                }
              }}
            >
              {item.label}
            </a>
          );
        }

        return (
          <span
            key={item.id}
            {...commonProps}
            aria-hidden="true"
            // Decorative: hover styling for pointer users; do not trap focus.
          >
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

export {
  BUBBLE_ENTER_MS,
  BUBBLE_TRAVEL_Y_PX,
  DEFAULT_BUBBLE_CLASSES,
  PRIMARY_BUBBLE_CLASSES,
};
