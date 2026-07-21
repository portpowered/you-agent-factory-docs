import type { ReactNode } from "react";
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
}: FactorySlideProps) {
  // Empty / whitespace-only commands still mount Terminal chrome.
  const terminalLines = [command.trim().length > 0 ? command : ""];

  return (
    <article
      data-factory-slide={id}
      className={cn(
        "factory-slide flex w-full flex-col gap-4 text-foreground",
        className,
      )}
    >
      {art != null ? (
        <div className="factory-slide__art" data-factory-slide-art="">
          {art}
        </div>
      ) : null}

      <div className="factory-slide__copy flex flex-col gap-2">
        <h3
          className="factory-slide__title text-xl font-semibold tracking-tight"
          data-factory-slide-title=""
        >
          {title}
        </h3>
        <p
          className="factory-slide__blurb text-sm text-muted-foreground"
          data-factory-slide-blurb=""
        >
          {blurb}
        </p>
      </div>

      <div className="factory-slide__command" data-factory-slide-command="">
        <Terminal lines={terminalLines} variant="dark" />
      </div>
    </article>
  );
}
