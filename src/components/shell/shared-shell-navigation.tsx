import type { SharedShellDestination } from "@/lib/shared-shell-config";
import Link from "next/link";

export type SharedShellNavigationLinkProps = {
  destination: SharedShellDestination;
  isCurrent?: boolean;
  className?: string;
};

function joinClassNames(
  ...classNames: Array<string | false | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

export function SharedShellNavigationLink({
  destination,
  isCurrent = false,
  className = "shared-shell__link",
}: SharedShellNavigationLinkProps) {
  const resolvedClassName = joinClassNames(
    className,
    "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2.5 font-semibold no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isCurrent
      ? "bg-accent text-accent-foreground"
      : "text-accent hover:bg-accent/10",
  );

  if (destination.external) {
    return (
      <a
        aria-label={`${destination.label} (opens in new tab)`}
        className={joinClassNames(
          resolvedClassName,
          "shared-shell__link--external",
        )}
        href={destination.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {destination.label}
      </a>
    );
  }

  return (
    <Link
      aria-current={isCurrent ? "page" : undefined}
      className={resolvedClassName}
      href={destination.href}
    >
      {destination.label}
    </Link>
  );
}

export type SharedShellPrimaryNavigationProps = {
  ariaLabel: string;
  className?: string;
  currentDestinationId?: string;
  destinations: SharedShellDestination[];
  id?: string;
};

export function SharedShellPrimaryNavigation({
  ariaLabel,
  className,
  currentDestinationId,
  destinations,
  id,
}: SharedShellPrimaryNavigationProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={joinClassNames(
        "shared-shell__header-nav flex flex-wrap gap-x-4 gap-y-3",
        className,
      )}
      id={id}
    >
      <ul className="shared-shell__nav-list m-0 flex list-none flex-wrap gap-x-4 gap-y-3 p-0">
        {destinations.map((destination) => (
          <li key={destination.id}>
            <SharedShellNavigationLink
              destination={destination}
              isCurrent={destination.id === currentDestinationId}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type SharedShellDocsNavigationItem = {
  id: string;
  label: string;
  href: string;
};

export type SharedShellDocsNavigationProps = {
  ariaLabel: string;
  currentItemId?: string;
  heading: string;
  items: SharedShellDocsNavigationItem[];
};

export function SharedShellDocsNavigation({
  ariaLabel,
  currentItemId,
  heading,
  items,
}: SharedShellDocsNavigationProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="shared-shell__docs-nav bg-card px-5 py-6"
    >
      <p className="shared-shell__docs-nav-heading m-0 mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-muted-foreground">
        {heading}
      </p>
      <ul className="shared-shell__docs-nav-list m-0 list-none p-0">
        {items.map((item) => {
          const isCurrent = item.id === currentItemId;

          return (
            <li className="mt-1 first:mt-0" key={item.id}>
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={
                  isCurrent
                    ? "shared-shell__docs-nav-link shared-shell__docs-nav-link--active block rounded-md bg-accent/12 px-3 py-2 text-sm font-medium text-accent no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    : "shared-shell__docs-nav-link block rounded-md px-3 py-2 text-sm font-medium text-card-foreground no-underline transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                }
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
