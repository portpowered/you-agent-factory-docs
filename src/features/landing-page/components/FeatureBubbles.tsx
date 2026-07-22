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
  description?: string;
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

/** Deliberately irregular scale/placement from the reference whale collage. */
const BUBBLE_LAYOUT: ReadonlyArray<{
  top: string;
  left: string;
  width: string;
  height: string;
  fontSize: string;
}> = [
  {
    top: "7%",
    left: "7%",
    width: "clamp(12rem, 27vw, 27rem)",
    height: "clamp(12rem, 27vw, 27rem)",
    fontSize: "clamp(1.35rem, 3.1vw, 3.2rem)",
  },
  {
    top: "10%",
    left: "59%",
    width: "clamp(13rem, 28vw, 28rem)",
    height: "clamp(13rem, 28vw, 28rem)",
    fontSize: "clamp(1.35rem, 3vw, 3.1rem)",
  },
  {
    top: "32%",
    left: "25%",
    width: "clamp(8rem, 15vw, 15rem)",
    height: "clamp(8rem, 15vw, 15rem)",
    fontSize: "clamp(0.8rem, 1.55vw, 1.55rem)",
  },
  {
    top: "36%",
    left: "47%",
    width: "clamp(6rem, 10vw, 10rem)",
    height: "clamp(6rem, 10vw, 10rem)",
    fontSize: "clamp(0.72rem, 1.2vw, 1.2rem)",
  },
  {
    top: "48%",
    left: "13%",
    width: "clamp(6rem, 10vw, 10rem)",
    height: "clamp(6rem, 10vw, 10rem)",
    fontSize: "clamp(0.7rem, 1.15vw, 1.15rem)",
  },
  {
    top: "49%",
    left: "33%",
    width: "clamp(14rem, 27vw, 27rem)",
    height: "clamp(14rem, 27vw, 27rem)",
    fontSize: "clamp(1.6rem, 3.4vw, 3.5rem)",
  },
  {
    top: "49%",
    left: "65%",
    width: "clamp(6rem, 10vw, 10rem)",
    height: "clamp(6rem, 10vw, 10rem)",
    fontSize: "clamp(0.72rem, 1.2vw, 1.2rem)",
  },
  {
    top: "61%",
    left: "66%",
    width: "clamp(6.5rem, 11vw, 11rem)",
    height: "clamp(6.5rem, 11vw, 11rem)",
    fontSize: "clamp(0.65rem, 1.05vw, 1.05rem)",
  },
  {
    top: "72%",
    left: "69%",
    width: "clamp(7rem, 12vw, 12rem)",
    height: "clamp(7rem, 12vw, 12rem)",
    fontSize: "clamp(0.72rem, 1.15vw, 1.15rem)",
  },
  {
    top: "18%",
    left: "39%",
    width: "clamp(7rem, 12vw, 12rem)",
    height: "clamp(7rem, 12vw, 12rem)",
    fontSize: "clamp(0.72rem, 1.15vw, 1.15rem)",
  },
  {
    top: "27%",
    left: "72%",
    width: "clamp(8rem, 14vw, 14rem)",
    height: "clamp(8rem, 14vw, 14rem)",
    fontSize: "clamp(0.78rem, 1.35vw, 1.35rem)",
  },
  {
    top: "68%",
    left: "8%",
    width: "clamp(9rem, 16vw, 16rem)",
    height: "clamp(9rem, 16vw, 16rem)",
    fontSize: "clamp(0.82rem, 1.45vw, 1.45rem)",
  },
  {
    top: "78%",
    left: "35%",
    width: "clamp(7.5rem, 13vw, 13rem)",
    height: "clamp(7.5rem, 13vw, 13rem)",
    fontSize: "clamp(0.75rem, 1.2vw, 1.2rem)",
  },
  {
    top: "82%",
    left: "55%",
    width: "clamp(8rem, 14vw, 14rem)",
    height: "clamp(8rem, 14vw, 14rem)",
    fontSize: "clamp(0.78rem, 1.3vw, 1.3rem)",
  },
  {
    top: "56%",
    left: "78%",
    width: "clamp(7rem, 12vw, 12rem)",
    height: "clamp(7rem, 12vw, 12rem)",
    fontSize: "clamp(0.72rem, 1.1vw, 1.1rem)",
  },
];

const DEFAULT_BUBBLE_CLASSES =
  "border-[#191f2b] bg-[#ecece4] text-[#191f2b] shadow-[5px_7px_0_rgba(25,31,43,0.18)]";
const PRIMARY_BUBBLE_CLASSES =
  "border-[#191f2b] bg-[#f3bd3d] text-[#191f2b] shadow-[5px_7px_0_rgba(25,31,43,0.24)]";

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
  const [phase, setPhase] = useState<EnterPhase>("visible");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Bubbles do not enter in lockstep with the whale — wait for armed + delay.
  useEffect(() => {
    if (!armed) return;

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
  const selectedItem = items.find((item) => item.id === selectedId);

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
        const isSelected = selectedId === item.id;
        const isPrimary = primaryId === item.id || isSelected;
        const interactive = Boolean(item.href);
        // Reduced motion: fade only — no Y travel (motion-whale.md).
        const offsetY = show || reduceMotion ? 0 : BUBBLE_TRAVEL_Y_PX;

        const staggerMs = show ? Math.min(index * 40, 160) : 0;
        // Keep delay inside the transition shorthand — do not mix with
        // transitionDelay (React warns and styling can fight itself).
        const style: CSSProperties = {
          top: layout.top,
          // Preserve the irregular desktop placement while keeping even the
          // widest circles fully reachable on narrow screens.
          left: `min(${layout.left}, calc(100% - ${layout.width} - 0.5rem))`,
          opacity: show ? 1 : 0,
          transform: `translateY(${offsetY}px)`,
          transition: reduceMotion
            ? `opacity ${BUBBLE_ENTER_MS}ms ease-out ${staggerMs}ms`
            : [
                `opacity ${BUBBLE_ENTER_MS}ms ease-out ${staggerMs}ms`,
                `transform ${BUBBLE_ENTER_MS}ms cubic-bezier(0.22, 0.9, 0.2, 1) ${staggerMs}ms`,
              ].join(", "),
          width: layout.width,
          height: layout.height,
          fontSize: layout.fontSize,
        };

        const bubbleClassName = cn(
          "pointer-events-auto absolute inline-flex items-center justify-center rounded-full border px-4 py-3 text-center font-sans leading-[1.04] font-medium whitespace-pre-line transition-[color,background-color,transform,box-shadow] hover:-translate-y-1",
          isPrimary ? PRIMARY_BUBBLE_CLASSES : DEFAULT_BUBBLE_CLASSES,
          interactive &&
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        );

        const commonProps = {
          "data-feature-bubble": "",
          "data-feature-bubble-id": item.id,
          "data-feature-bubble-primary": isPrimary ? "true" : "false",
          "data-feature-bubble-selected": isSelected ? "true" : "false",
          className: bubbleClassName,
          style,
          onMouseEnter: () => setPrimaryId(item.id),
          onClick: () => {
            setSelectedId((current) => (current === item.id ? null : item.id));
          },
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
                  setSelectedId(null);
                  (event.currentTarget as HTMLAnchorElement).blur();
                }
              }}
            >
              {item.label}
            </a>
          );
        }

        return (
          <button
            key={item.id}
            {...commonProps}
            aria-expanded={item.description ? isSelected : undefined}
            aria-controls={
              item.description ? "feature-bubble-detail" : undefined
            }
            onBlur={() =>
              setPrimaryId((current) => (current === item.id ? null : current))
            }
            onFocus={() => setPrimaryId(item.id)}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === "Escape") {
                setSelectedId(null);
                event.currentTarget.blur();
              }
            }}
            type="button"
          >
            {item.label}
          </button>
        );
      })}

      {selectedItem?.description ? (
        <aside
          aria-live="polite"
          className="pointer-events-auto absolute top-[32%] right-[8%] left-[8%] z-30 border-2 border-[#191f2b] bg-[#f3bd3d] px-5 py-5 text-[#191f2b] shadow-[9px_9px_0_rgba(25,31,43,0.38)] motion-safe:animate-[feature-bubble-detail_420ms_cubic-bezier(0.16,0.84,0.22,1)_both] sm:right-[16%] sm:left-[16%] sm:px-8 sm:py-7"
          data-feature-bubble-detail=""
          id="feature-bubble-detail"
        >
          <button
            aria-label="Close feature details"
            className="absolute top-3 right-3 grid size-10 place-items-center rounded-full border border-[#191f2b] text-2xl leading-none transition-colors hover:bg-[#191f2b] hover:text-[#f3bd3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191f2b]"
            data-feature-bubble-detail-close=""
            onClick={() => setSelectedId(null)}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
          <p className="font-mono text-[clamp(2rem,5vw,5rem)] leading-[0.86] font-black tracking-[-0.08em] uppercase">
            {selectedItem.label}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed sm:text-base">
            {selectedItem.description}
          </p>
        </aside>
      ) : null}
    </div>
  );
}

export {
  BUBBLE_ENTER_MS,
  BUBBLE_TRAVEL_Y_PX,
  DEFAULT_BUBBLE_CLASSES,
  PRIMARY_BUBBLE_CLASSES,
};
