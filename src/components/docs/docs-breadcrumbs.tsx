import type { DocsBreadcrumbTrail } from "@/lib/content/docs-breadcrumbs";
import Link from "next/link";

export type DocsBreadcrumbsProps = {
  ariaLabel: string;
  trail: DocsBreadcrumbTrail;
};

export function DocsBreadcrumbs({ ariaLabel, trail }: DocsBreadcrumbsProps) {
  if (trail.items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className="mb-6">
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0 text-sm text-muted-foreground">
        {trail.items.map((item, index) => {
          const isCurrent = index === trail.items.length - 1;

          return (
            <li
              className="inline-flex items-center gap-2"
              key={`${item.label}-${index}`}
            >
              {item.href && !isCurrent ? (
                <Link
                  className="no-underline transition-colors hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className="font-semibold text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {item.label}
                </span>
              )}
              {!isCurrent ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
