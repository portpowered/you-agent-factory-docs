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

  return (
    <article
      data-factory-slide={id}
      data-factory-slide-presentation={presentation}
      className={cn(
        "factory-slide relative h-full w-full overflow-hidden",
        isFeature
          ? "bg-[#f1eee6] text-[#191f2b]"
          : "bg-[#191f2b] px-[clamp(0.45rem,1.25vw,1.25rem)] py-[clamp(0.7rem,1.5vw,1.5rem)] text-[#f1eee6]",
        className,
      )}
    >
      {backgroundArtSrc != null || art != null ? (
        <div
          aria-hidden={backgroundArtSrc != null ? "true" : undefined}
          className={cn(
            "factory-slide__art pointer-events-none",
            isFeature
              ? "absolute top-[-6%] right-0 left-[5%] z-0 h-[82%] origin-top-left scale-[1.3]"
              : "sr-only",
          )}
          data-factory-slide-art=""
        >
          {backgroundArtSrc != null ? (
            <img
              alt=""
              className="h-full w-full object-contain object-left-top mix-blend-multiply"
              decoding="async"
              src={backgroundArtSrc}
            />
          ) : null}
          {art}
        </div>
      ) : null}

      <div
        className={cn(
          "factory-slide__copy relative z-10 flex flex-col",
          isFeature
            ? "absolute bottom-[25%] left-[11%] gap-0"
            : "h-full gap-[clamp(0.35rem,0.8vw,0.75rem)]",
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
          isFeature
            ? "absolute right-[45%] bottom-[13%] left-[11%] z-20"
            : "sr-only",
        )}
        data-factory-slide-command=""
      >
        <Terminal
          activeChip={isFeature ? activeProvider : undefined}
          chips={isFeature ? providers : undefined}
          className="rounded-[0.35rem] border-0 shadow-none [&_[data-terminal-body]]:px-4 [&_[data-terminal-body]]:py-3 [&_[data-terminal-body]]:text-[clamp(0.45rem,0.72vw,0.78rem)] [&_[data-terminal-body]]:!text-[#f3bd3d] [&_[data-terminal-body]_code]:!text-[#f3bd3d] [&_[data-terminal-chips]]:gap-4 [&_[data-terminal-chrome]]:border-0 [&_[data-terminal-chrome]]:px-4 [&_[data-terminal-chrome]]:py-2 [&_[data-terminal-copy]]:rounded-sm [&_[data-terminal-copy]]:border [&_[data-terminal-copy]]:border-transparent [&_[data-terminal-copy]]:bg-transparent [&_[data-terminal-copy]:hover]:border-zinc-600 [&_[data-terminal-traffic-lights]]:hidden"
          lines={terminalLines}
          onChipChange={isFeature ? setActiveProvider : undefined}
          variant="dark"
        />
      </div>
    </article>
  );
}
