"use client";

import { DocPageBody } from "@/components/docs/doc-page-body";
import { parseDocPageBody } from "@/lib/content/docs-page-outline";
import type { CanonicalContentRecord } from "@/lib/content/types";

export type PublicContentArticleProps = {
  body: string;
  record: CanonicalContentRecord;
  title: string;
};

export function PublicContentArticle({
  body,
  record,
  title,
}: PublicContentArticleProps) {
  const parsed = parseDocPageBody(body);

  return (
    <article
      aria-labelledby="public-content-page-title"
      className="public-content-page"
    >
      <div className="public-content-page__header">
        <p className="public-content-page__eyebrow">{record.section}</p>
        <ul className="public-content-page__meta" aria-label={record.kind}>
          <li>{record.kind}</li>
          {record.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <h1 id="public-content-page-title">{title}</h1>
      </div>
      <DocPageBody blocks={parsed.blocks} />
    </article>
  );
}
