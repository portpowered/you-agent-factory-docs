"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_WHALE_PLATE_THEME,
  resolveWhalePlateTheme,
  WHALE_PLATE_DEFAULT_SRC,
  WHALE_PLATE_INITIAL_OPACITY,
  type WhalePlateThemeKnobs,
  whaleEaseToCss,
} from "./whale-plate.theme";

export type WhalePlateProps = {
  /**
   * Whale plate image URL. Defaults to `/home/mid-end-whale.png`.
   * Pass a harness-safe fixture src when the staged asset is absent.
   */
  src?: string;
  /** Optional accessible label; decorative by default. */
  alt?: string;
  className?: string;
  /**
   * Optional theme knob overrides (tests / harness / future theme wiring).
   * Defaults match motion-whale.md via whale-plate.theme.ts.
   */
  theme?: Partial<WhalePlateThemeKnobs>;
  /**
   * Fired once when the heavy grow-in finishes (or immediately under
   * prefers-reduced-motion). Bubbles/section use this for delayed enter.
   */
  onSettle?: () => void;
};

type EntrancePhase = "initial" | "entering" | "settled";

/** Y-channel easing from motion-whale.md (slightly different from scale). */
const Y_EASE_CSS = "cubic-bezier(0.22, 0.9, 0.2, 1)";

/**
 * Mid→end whale plate with one-shot in-view heavy grow-in.
 * Public contract: `<WhalePlate className? src? theme? onSettle? />`.
 */
export function WhalePlate({
  src = WHALE_PLATE_DEFAULT_SRC,
  alt = "",
  className,
  theme,
  onSettle,
}: WhalePlateProps) {
  const resolved = resolveWhalePlateTheme(theme);
  const rootRef = useRef<HTMLDivElement>(null);
  const settleFiredRef = useRef(false);
  const onSettleRef = useRef(onSettle);
  const [phase, setPhase] = useState<EntrancePhase>("initial");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    onSettleRef.current = onSettle;
  }, [onSettle]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // One-shot enter-view: IntersectionObserver with theme viewAmount, once.
  // Reduced motion: skip travel and settle immediately at rest.
  useEffect(() => {
    const markSettled = () => {
      if (settleFiredRef.current) return;
      settleFiredRef.current = true;
      setPhase("settled");
      onSettleRef.current?.();
    };

    if (reduceMotion) {
      markSettled();
      return;
    }

    const node = rootRef.current;
    if (!node || phase !== "initial") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setPhase("entering");
          observer.disconnect();
          break;
        }
      },
      { threshold: resolved.viewAmount },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [phase, reduceMotion, resolved.viewAmount]);

  // Settle after the heavy scale duration (opacity/blur finish earlier).
  useEffect(() => {
    if (reduceMotion || phase !== "entering") return;

    const timer = window.setTimeout(() => {
      if (settleFiredRef.current) return;
      settleFiredRef.current = true;
      setPhase("settled");
      onSettleRef.current?.();
    }, resolved.durationMs);

    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion, resolved.durationMs]);

  const easeCss = whaleEaseToCss(resolved.ease);
  const durationSec = resolved.durationMs / 1000;
  const yDurationSec = (resolved.durationMs * 1.09375) / 1000;
  const opacityDurationSec = (resolved.durationMs * 0.75) / 1000;
  const blurDurationSec = (resolved.durationMs * 0.875) / 1000;
  const showRest = reduceMotion || phase !== "initial";

  const yStyle: CSSProperties = {
    transform: showRest
      ? "translateY(0)"
      : `translateY(${resolved.initialY}px)`,
    transition: reduceMotion
      ? "none"
      : `transform ${yDurationSec}s ${Y_EASE_CSS}`,
  };

  const plateStyle: CSSProperties = {
    transformOrigin: "center center",
    transform: showRest ? "scale(1)" : `scale(${resolved.initialScale})`,
    opacity: showRest ? 1 : WHALE_PLATE_INITIAL_OPACITY,
    filter: showRest ? "blur(0px)" : `blur(${resolved.blurPx}px)`,
    transition: reduceMotion
      ? "none"
      : [
          `transform ${durationSec}s ${easeCss}`,
          `opacity ${opacityDurationSec}s ease-out`,
          `filter ${blurDurationSec}s ease-out`,
        ].join(", "),
  };

  return (
    <div
      ref={rootRef}
      aria-hidden={alt === "" ? true : undefined}
      className={cn("relative w-full", className)}
      data-whale-plate=""
      data-whale-phase={reduceMotion ? "settled" : phase}
      data-whale-initial-scale={String(resolved.initialScale)}
      data-whale-initial-y={String(resolved.initialY)}
      data-whale-duration-ms={String(resolved.durationMs)}
      data-whale-view-amount={String(resolved.viewAmount)}
      data-whale-blur-px={String(resolved.blurPx)}
      data-whale-bubble-delay-ms={String(resolved.bubbleDelayMs)}
    >
      <div data-whale-plate-y="" style={yStyle}>
        {/*
          Harness-safe: default src points at staged /home asset; override via
          src when the file is not present so the plate still mounts.
        */}
        <img
          alt={alt}
          className="block h-auto w-full max-w-full select-none"
          data-whale-plate-image=""
          decoding="async"
          draggable={false}
          src={src}
          style={plateStyle}
        />
      </div>
    </div>
  );
}

export { DEFAULT_WHALE_PLATE_THEME, WHALE_PLATE_DEFAULT_SRC };
