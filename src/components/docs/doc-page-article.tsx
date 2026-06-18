"use client";

import { DocPageBody } from "@/components/docs/doc-page-body";
import {
  DocsContentCard,
  DocsContentSurface,
} from "@/components/docs/docs-content";
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
    <DocsContentSurface aria-labelledby="doc-page-title">
      <DocsPageOutlineNav
        ariaLabel={t("docs.pageOutlineAriaLabel")}
        onThisPageLabel={t("docs.onThisPageLabel")}
        outline={outline}
      />
      <DocsContentCard as="section">
        <h1
          className="m-0 text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-tight text-card-foreground"
          id="doc-page-title"
        >
          {title}
        </h1>
        <DocPageBody blocks={parsed.blocks} />
      </DocsContentCard>
    </DocsContentSurface>
  );
}
