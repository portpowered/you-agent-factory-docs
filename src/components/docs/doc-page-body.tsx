import type { DocPageBodyBlock } from "@/lib/content/docs-page-outline";
import type { JSX } from "react";

export type DocPageBodyProps = {
  blocks: DocPageBodyBlock[];
};

export function DocPageBody({ blocks }: DocPageBodyProps) {
  return (
    <div className="docs-page__body">
      {blocks.map((block) => {
        if (block.type === "heading") {
          if (block.level === 1) {
            return null;
          }

          const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;

          return (
            <HeadingTag id={block.id} key={block.id}>
              {block.text}
            </HeadingTag>
          );
        }

        return <p key={`paragraph-${block.text}`}>{block.text}</p>;
      })}
    </div>
  );
}
