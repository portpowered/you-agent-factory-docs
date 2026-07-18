/**
 * Desktop tag-grouped operation navigator for the W08 production API surface.
 *
 * Always-visible on large viewports; jump links target stable operation
 * section anchors from the single-page projection / W04 summaries.
 */

import { cn } from "@/lib/utils";
import {
  API_OPERATION_NAV_ARIA_LABEL,
  API_OPERATION_NAV_ATTR,
  API_OPERATION_NAV_LINK_ATTR,
  type ApiOperationNavGroup,
  type ApiOperationNavModel,
} from "./operation-navigation";

export type ApiOperationNavigatorProps = {
  groups: readonly ApiOperationNavGroup[];
  /** Optional precomputed model (linkCount used for chrome labeling). */
  model?: ApiOperationNavModel;
  className?: string;
  "data-testid"?: string;
};

function methodLabel(method: string): string {
  return method.toUpperCase();
}

/**
 * Desktop operation navigator: tag groups with deep links to operation sections.
 */
export function ApiOperationNavigator({
  groups,
  model,
  className,
  "data-testid": testId = "api-operation-navigator",
}: ApiOperationNavigatorProps) {
  const linkCount =
    model?.linkCount ??
    groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <nav
      aria-label={API_OPERATION_NAV_ARIA_LABEL}
      className={cn(
        "min-w-0 rounded-lg border border-border bg-muted/20 p-4",
        className,
      )}
      {...{ [API_OPERATION_NAV_ATTR]: "" }}
      data-testid={testId}
      data-api-operation-nav-link-count={linkCount}
    >
      <p className="mb-3 text-sm font-medium text-foreground">
        {API_OPERATION_NAV_ARIA_LABEL}
        <span className="ml-1 font-normal text-muted-foreground">
          ({linkCount})
        </span>
      </p>
      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.tag}
            className="min-w-0"
            data-api-operation-nav-tag={group.tag}
          >
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.tag}
            </h2>
            <ul className="space-y-1 text-sm">
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
  );
}
