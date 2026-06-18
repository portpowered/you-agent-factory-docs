import { DocsContentCard } from "@/components/docs/docs-content";
import type { DocsPageOutline } from "@/lib/content/docs-page-outline";

export type DocsPageOutlineNavProps = {
  ariaLabel: string;
  onThisPageLabel: string;
  outline: DocsPageOutline;
};

export function DocsPageOutlineNav({
  ariaLabel,
  onThisPageLabel,
  outline,
}: DocsPageOutlineNavProps) {
  if (outline.headings.length === 0) {
    return null;
  }

  return (
    <DocsContentCard
      as="nav"
      aria-label={ariaLabel}
      className="docs-page-outline border-border/70 bg-muted/30 p-4 sm:p-5"
    >
      <p className="docs-page-outline__title">{onThisPageLabel}</p>
      <ol className="docs-page-outline__list">
        {outline.headings.map((heading) => (
          <li
            className={`docs-page-outline__item docs-page-outline__item--level-${heading.level}`}
            key={heading.id}
          >
            <a className="docs-page-outline__link" href={`#${heading.id}`}>
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </DocsContentCard>
  );
}
