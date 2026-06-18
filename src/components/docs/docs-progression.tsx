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
    <nav aria-label={ariaLabel} className="mt-10 border-t pt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {progression.previous ? (
          <Link
            className="group flex flex-col gap-1 rounded-lg border bg-card px-4 py-3 no-underline transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={progression.previous.href}
            rel="prev"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              {previousPagePrefix}
            </span>
            <span className="text-sm font-semibold text-foreground group-hover:text-accent group-hover:underline">
              {progression.previous.label}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}
        {progression.next ? (
          <Link
            className="group flex flex-col gap-1 rounded-lg border bg-card px-4 py-3 text-left no-underline transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:col-start-2 sm:items-end sm:text-right"
            href={progression.next.href}
            rel="next"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              {nextPagePrefix}
            </span>
            <span className="text-sm font-semibold text-foreground group-hover:text-accent group-hover:underline">
              {progression.next.label}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" className="hidden sm:block" />
        )}
      </div>
    </nav>
  );
}
