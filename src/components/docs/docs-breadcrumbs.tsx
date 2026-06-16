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
    <nav aria-label={ariaLabel} className="docs-breadcrumbs">
      <ol className="docs-breadcrumbs__list">
        {trail.items.map((item, index) => {
          const isCurrent = index === trail.items.length - 1;

          return (
            <li
              className="docs-breadcrumbs__item"
              key={`${item.label}-${index}`}
            >
              {item.href && !isCurrent ? (
                <Link className="docs-breadcrumbs__link" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className="docs-breadcrumbs__current"
                >
                  {item.label}
                </span>
              )}
              {!isCurrent ? (
                <span
                  aria-hidden="true"
                  className="docs-breadcrumbs__separator"
                >
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
