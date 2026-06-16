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
  if (destination.external) {
    return (
      <a
        aria-label={`${destination.label} (opens in new tab)`}
        className={joinClassNames(className, "shared-shell__link--external")}
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
      className={className}
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
      className={joinClassNames("shared-shell__header-nav", className)}
      id={id}
    >
      <ul className="shared-shell__nav-list">
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
    <nav aria-label={ariaLabel} className="shared-shell__docs-nav">
      <p className="shared-shell__docs-nav-heading">{heading}</p>
      <ul className="shared-shell__docs-nav-list">
        {items.map((item) => {
          const isCurrent = item.id === currentItemId;

          return (
            <li key={item.id}>
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={
                  isCurrent
                    ? "shared-shell__docs-nav-link shared-shell__docs-nav-link--active"
                    : "shared-shell__docs-nav-link"
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
