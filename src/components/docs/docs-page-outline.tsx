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
    <nav aria-label={ariaLabel} className="docs-page-outline">
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
    </nav>
  );
}
