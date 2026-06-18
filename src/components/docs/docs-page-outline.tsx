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
      <p className="m-0 text-sm font-semibold uppercase tracking-[0.04em] text-muted-foreground">
        {onThisPageLabel}
      </p>
      <ol className="m-0 mt-4 grid list-none gap-3 p-0">
        {outline.headings.map((heading) => (
          <li
            className={heading.level === 3 ? "pl-4" : undefined}
            key={heading.id}
          >
            <a
              className="text-sm font-medium text-foreground no-underline transition-colors hover:text-accent hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={`#${heading.id}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </DocsContentCard>
  );
}
