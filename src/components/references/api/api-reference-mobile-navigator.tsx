/**
 * Phone/tablet tag-grouped operation navigator for the W08 production API surface.
 *
 * Collapsed-by-default `<details>` so the first viewport stays usable; the open
 * list scrolls inside a capped height instead of stretching the page.
 */

import { cn } from "@/lib/utils";
import {
  API_PRINT_CHROME_ATTR,
  API_PRINT_CHROME_HIDE,
} from "./a11y-verification";
import {
  API_MOBILE_NAV_ATTR,
  API_MOBILE_NAV_CONTRACT,
  API_MOBILE_NAV_LIST_ATTR,
  API_OPERATION_NAV_ARIA_LABEL,
  API_OPERATION_NAV_LINK_ATTR,
  type ApiOperationNavGroup,
  type ApiOperationNavModel,
} from "./operation-navigation";

export type ApiReferenceMobileNavigatorProps = {
  groups: readonly ApiOperationNavGroup[];
  model?: ApiOperationNavModel;
  className?: string;
  "data-testid"?: string;
};

function methodLabel(method: string): string {
  return method.toUpperCase();
}

/**
 * Constrained mobile/tablet operation navigator (details-summary, closed by default).
 */
export function ApiReferenceMobileNavigator({
  groups,
  model,
  className,
  "data-testid": testId = "api-reference-mobile-navigator",
}: ApiReferenceMobileNavigatorProps) {
  const linkCount =
    model?.linkCount ??
    groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <details
      className={cn(
        "min-w-0 rounded-lg border border-border bg-muted/30",
        className,
      )}
      {...{
        [API_MOBILE_NAV_ATTR]: "",
        [API_PRINT_CHROME_ATTR]: API_PRINT_CHROME_HIDE,
      }}
      data-testid={testId}
      data-api-operation-nav-link-count={linkCount}
    >
      <summary className="cursor-pointer list-none p-4 text-sm font-medium marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="text-foreground">
          {API_OPERATION_NAV_ARIA_LABEL} ({linkCount})
        </span>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          Tap to expand tag-grouped operation links (collapsed by default for
          phone and tablet widths)
        </span>
      </summary>
      <nav
        aria-label={API_OPERATION_NAV_ARIA_LABEL}
        className="border-t border-border px-4 pb-4 pt-3"
      >
        <div
          className={cn(
            "space-y-4 overflow-x-hidden overflow-y-auto text-sm",
            API_MOBILE_NAV_CONTRACT.openListMaxHeightClass,
          )}
          {...{ [API_MOBILE_NAV_LIST_ATTR]: "" }}
        >
          {groups.map((group) => (
            <div
              key={group.tag}
              className="min-w-0"
              data-api-operation-nav-tag={group.tag}
            >
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.tag}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={`${group.tag}:${item.id}`} className="min-w-0">
                    <a
                      className="block min-w-0 break-words text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      href={`#${item.anchor}`}
                      {...{ [API_OPERATION_NAV_LINK_ATTR]: item.anchor }}
                      data-api-operation-nav-method={item.method}
                      data-api-operation-nav-path={item.path}
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {methodLabel(item.method)}
                      </span>{" "}
                      <span className="text-foreground">
                        {item.summary ?? item.path}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </details>
  );
}
