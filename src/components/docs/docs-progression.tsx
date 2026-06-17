import type { DocsProgressionLinks } from "@/lib/content/docs-progression";
import Link from "next/link";

export type DocsProgressionProps = {
  ariaLabel: string;
  nextPagePrefix: string;
  previousPagePrefix: string;
  progression: DocsProgressionLinks;
};

export function DocsProgression({
  ariaLabel,
  nextPagePrefix,
  previousPagePrefix,
  progression,
}: DocsProgressionProps) {
  if (!progression.previous && !progression.next) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className="docs-progression">
      <div className="docs-progression__links">
        {progression.previous ? (
          <Link
            className="docs-progression__link docs-progression__link--previous"
            href={progression.previous.href}
            rel="prev"
          >
            <span className="docs-progression__prefix">
              {previousPagePrefix}
            </span>
            <span className="docs-progression__label">
              {progression.previous.label}
            </span>
          </Link>
        ) : (
          <span className="docs-progression__placeholder" />
        )}
        {progression.next ? (
          <Link
            className="docs-progression__link docs-progression__link--next"
            href={progression.next.href}
            rel="next"
          >
            <span className="docs-progression__prefix">{nextPagePrefix}</span>
            <span className="docs-progression__label">
              {progression.next.label}
            </span>
          </Link>
        ) : (
          <span className="docs-progression__placeholder" />
        )}
      </div>
    </nav>
  );
}
