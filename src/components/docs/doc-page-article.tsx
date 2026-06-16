"use client";

import { DocPageBody } from "@/components/docs/doc-page-body";
import { DocsPageOutlineNav } from "@/components/docs/docs-page-outline";
import {
  parseDocPageBody,
  projectDocsPageOutline,
} from "@/lib/content/docs-page-outline";
import { useMessages } from "@/localization/hooks/use-messages";

export type DocPageArticleProps = {
  body: string;
  title: string;
};

export function DocPageArticle({ body, title }: DocPageArticleProps) {
  const { t } = useMessages();
  const parsed = parseDocPageBody(body);
  const outline = projectDocsPageOutline(parsed);

  return (
    <article aria-labelledby="doc-page-title">
      <DocsPageOutlineNav
        ariaLabel={t("docs.pageOutlineAriaLabel")}
        onThisPageLabel={t("docs.onThisPageLabel")}
        outline={outline}
      />
      <h1 id="doc-page-title">{title}</h1>
      <DocPageBody blocks={parsed.blocks} />
    </article>
  );
}
