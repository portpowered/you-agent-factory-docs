import type { DocPageBodyBlock } from "@/lib/content/docs-page-outline";
import type { JSX } from "react";

export type DocPageBodyProps = {
  blocks: DocPageBodyBlock[];
};

function getHeadingClassName(level: number): string {
  if (level === 2) {
    return "mt-8 scroll-mt-24 text-2xl font-semibold tracking-tight text-card-foreground";
  }

  if (level === 3) {
    return "mt-7 scroll-mt-24 text-xl font-semibold tracking-tight text-card-foreground";
  }

  return "scroll-mt-24 font-semibold tracking-tight text-card-foreground";
}

export function DocPageBody({ blocks }: DocPageBodyProps) {
  return (
    <div className="mt-5 text-[1.02rem] leading-7 text-foreground [&>*+*]:mt-4">
      {blocks.map((block) => {
        if (block.type === "heading") {
          if (block.level === 1) {
            return null;
          }

          const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;

          return (
            <HeadingTag
              className={getHeadingClassName(block.level)}
              id={block.id}
              key={block.id}
            >
              {block.text}
            </HeadingTag>
          );
        }

        return (
          <p
            className="m-0 max-w-[72ch] text-muted-foreground"
            key={`paragraph-${block.text}`}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
