import { ButtonLink } from "@/components/ui/button";
import { joinClassNames } from "@/lib/classnames";
import type { SharedShellDestination } from "@/lib/shared-shell-config";

export type SharedShellNavigationLinkProps = {
  destination: SharedShellDestination;
  isCurrent?: boolean;
  className?: string;
};

export function SharedShellNavigationLink({
  destination,
  isCurrent = false,
  className,
}: SharedShellNavigationLinkProps) {
  return (
    <ButtonLink
      aria-current={isCurrent ? "page" : undefined}
      aria-label={
        destination.external
          ? `${destination.label} (opens in new tab)`
          : undefined
      }
      className={joinClassNames(
        className,
        "max-[1023px]:w-full max-[1023px]:justify-start",
      )}
      external={destination.external}
      href={destination.href}
      variant={isCurrent ? "navCurrent" : "nav"}
    >
      {destination.label}
    </ButtonLink>
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
        "flex flex-wrap gap-x-4 gap-y-3 max-[1023px]:w-full",
        className,
      )}
      id={id}
    >
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-3 p-0 max-[1023px]:flex-col max-[1023px]:items-stretch">
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
    <nav aria-label={ariaLabel} className="bg-card px-5 py-6">
      <p className="m-0 mb-3 text-sm font-semibold uppercase tracking-[0.04em] text-muted-foreground">
        {heading}
      </p>
      <ul className="m-0 list-none p-0">
        {items.map((item) => {
          const isCurrent = item.id === currentItemId;

          return (
            <li className="mt-1 first:mt-0" key={item.id}>
              <ButtonLink
                aria-current={isCurrent ? "page" : undefined}
                className={joinClassNames("block justify-start font-medium")}
                data-current={isCurrent ? "true" : undefined}
                fullWidth
                href={item.href}
                size="compact"
                variant="navSubtle"
              >
                {item.label}
              </ButtonLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
