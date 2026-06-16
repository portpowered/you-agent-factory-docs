import { DocPageBody } from "@/components/docs/doc-page-body";
import { DocsPageOutlineNav } from "@/components/docs/docs-page-outline";
import {
  parseDocPageBody,
  projectDocsPageOutline,
} from "@/lib/content/docs-page-outline";

export type DocPageArticleProps = {
  body: string;
  onThisPageLabel: string;
  outlineAriaLabel: string;
  title: string;
};

export function DocPageArticle({
  body,
  onThisPageLabel,
  outlineAriaLabel,
  title,
}: DocPageArticleProps) {
  const parsed = parseDocPageBody(body);
  const outline = projectDocsPageOutline(parsed);

  return (
    <article aria-labelledby="doc-page-title">
      <DocsPageOutlineNav
        ariaLabel={outlineAriaLabel}
        onThisPageLabel={onThisPageLabel}
        outline={outline}
      />
      <h1 id="doc-page-title">{title}</h1>
      <DocPageBody blocks={parsed.blocks} />
    </article>
  );
}
