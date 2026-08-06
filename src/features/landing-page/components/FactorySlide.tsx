"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Terminal } from "@/features/code";
import { cn } from "@/lib/utils";

/**
 * Locked factory slide shape for FactoryCarousel (homepage-2 contracts).
 * Decorative art is caller-owned (`art?: ReactNode`); no CMS/schema invention.
 */
export type FactorySlideData = {
  id: string;
  title: string;
  blurb: string;
  command: string;
  /** Per-slide creature plate. WebP, served from `/home/factories`. */
  artSrc?: string;
  art?: ReactNode;
};

export type FactorySlideProps = FactorySlideData & {
  className?: string;
  /** Wide parchment feature card or compact navy rail card. */
  presentation?: "feature" | "rail";
  /** Decorative artwork used by the wide feature card. */
  backgroundArtSrc?: string;
};

/**
 * One factory/workflow slide: title, blurb, optional art, and Terminal command
 * chrome from `@/features/code`.
 */
export function FactorySlide({
  id,
  title,
  blurb,
  command,
  art,
  artSrc,
  className,
  presentation = "feature",
  backgroundArtSrc,
}: FactorySlideProps) {
  const providers = ["Codex", "Cursor", "Claude"];
  const [activeProvider, setActiveProvider] = useState(providers[0]);
  // Empty / whitespace-only commands still mount Terminal chrome.
  const terminalLines = [
    command.trim().length > 0
      ? `${command} --provider ${activeProvider.toLowerCase()}`
      : "",
  ];
  const isFeature = presentation === "feature";
  // Per-slide creature plate, falling back to the shared feature art.
  const plateSrc = artSrc ?? backgroundArtSrc;

  return (
    <article
      data-factory-slide={id}
      data-factory-slide-presentation={presentation}
      className={cn(
        "factory-slide relative h-full w-full overflow-hidden",
        // Every slide is the same box on the carousel track, so the feature
        // card lays its parts out in flow rather than pinning them to fixed
        // percentages of a much wider card.
        // Both surfaces are light: the unfocused cards read as paper stacked
        // behind the focused one rather than as dark holes in the scene.
        isFeature
          ? "flex flex-col bg-[#f1eee6] px-[clamp(1rem,2vw,2rem)] py-[clamp(1rem,2vw,2rem)] text-[#191f2b]"
          : "flex flex-col border border-[#191f2b]/12 bg-white px-[clamp(0.45rem,1.25vw,1.25rem)] py-[clamp(0.7rem,1.5vw,1.5rem)] text-[#191f2b] shadow-[0_12px_36px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      {plateSrc != null ? (
        /*
         * Blurred, low-contrast copy of the plate bled behind the whole card.
         * It gives the header something to sit on so the title reads as part of
         * the artwork instead of as a caption floating above it.
         */
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          data-factory-slide-art-wash=""
        >
          <img
            alt=""
            className="h-full w-full scale-125 object-cover opacity-25 blur-2xl"
            decoding="async"
            loading="lazy"
            src={plateSrc}
          />
        </div>
      ) : null}

      {plateSrc != null || art != null ? (
        <div
          aria-hidden={plateSrc != null ? "true" : undefined}
          // No z-index: a positioned element with one starts its own stacking
          // context, which isolates `mix-blend-multiply` from the card behind
          // it and leaves each plate's white backing painted as a hard box.
          className="factory-slide__art pointer-events-none relative min-h-0 flex-1"
          data-factory-slide-art=""
        >
          {plateSrc != null ? (
            <img
              alt=""
              className="h-full w-full object-contain object-center mix-blend-multiply"
              decoding="async"
              loading="lazy"
              src={plateSrc}
            />
          ) : null}
          {art}
        </div>
      ) : null}

      <div
        className={cn(
          "factory-slide__copy relative z-10 flex flex-col",
          isFeature
            ? "shrink-0 gap-1 pb-[clamp(0.6rem,1.2vw,1.2rem)]"
            : "shrink-0 gap-[clamp(0.2rem,0.5vw,0.5rem)]",
        )}
      >
        <h3
          className={cn(
            "factory-slide__title font-sans font-normal tracking-[-0.055em]",
            isFeature
              ? "text-[clamp(2rem,4vw,4rem)] leading-none uppercase"
              : "text-[clamp(1.25rem,3.2vw,3.2rem)] leading-none lowercase",
          )}
          data-factory-slide-title=""
        >
          {title}
        </h3>
        <p
          className={cn(
            "factory-slide__blurb whitespace-pre-line",
            isFeature
              ? "font-sans text-[clamp(0.62rem,1.25vw,1.15rem)] leading-tight"
              : "font-sans text-[clamp(0.5rem,0.92vw,0.88rem)] leading-[1.08]",
          )}
          data-factory-slide-blurb=""
        >
          {blurb}
        </p>
      </div>

      <div
        className={cn(
          "factory-slide__command",
          // Full card width: every slide now shares one uniform box, so the
          // command no longer has a wide feature card to sit in half of.
          isFeature ? "relative z-20 shrink-0" : "sr-only",
        )}
        data-factory-slide-command=""
      >
        <Terminal
          activeChip={isFeature ? activeProvider : undefined}
          chips={isFeature ? providers : undefined}
          // Layout only. The navy/yellow palette now comes from the shared
          // dark shell, so this no longer has to re-tint every part by hand.
          className="rounded-[0.35rem] shadow-none [&_[data-terminal-body]]:px-3 [&_[data-terminal-body]]:py-2.5 [&_[data-terminal-body]]:text-[clamp(0.4rem,0.62vw,0.7rem)] [&_[data-terminal-body]]:whitespace-pre-wrap [&_[data-terminal-body]_code]:whitespace-pre-wrap [&_[data-terminal-chips]]:gap-2 [&_[data-terminal-chrome]]:px-3 [&_[data-terminal-chrome]]:py-1.5 [&_[data-terminal-traffic-lights]]:hidden"
          lines={terminalLines}
          onChipChange={isFeature ? setActiveProvider : undefined}
          variant="dark"
        />
      </div>
    </article>
  );
}
