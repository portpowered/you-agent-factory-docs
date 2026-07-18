"use client";

/**
 * Path breadcrumb with copyable W04 deep-link anchor.
 *
 * Copies a usable fragment (`#anchor`) or full `pagePath#anchor` URL.
 * The `anchor` prop must already be W04-derived — this control does not mint IDs.
 */

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";

export type SchemaBreadcrumbProps = {
  /** Visible path segments (pointer or field-path parts). */
  segments: readonly string[];
  /** URL fragment without `#` from W04 `anchorForIdentity`. */
  anchor: string;
  /**
   * Full path+fragment when known. Copied as-is when present; otherwise
   * `#${anchor}` is copied.
   */
  href?: string;
  /** Accessible name for the navigation landmark. */
  "aria-label"?: string;
  className?: string;
  "data-testid"?: string;
};

const COPY_LABEL = "Copy deep link";
const COPIED_LABEL = "Copied deep link";

export function SchemaBreadcrumb({
  segments,
  anchor,
  href,
  "aria-label": ariaLabel = "Schema path",
  className,
  "data-testid": testId = "schema-breadcrumb",
}: SchemaBreadcrumbProps) {
  const copyValue = href ?? `#${anchor}`;
  const [checked, onClick] = useCopyButton(async () => {
    await navigator.clipboard.writeText(copyValue);
  });

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2 text-sm",
        className,
      )}
      data-schema-anchor={anchor}
      data-schema-deep-link={copyValue}
      data-testid={testId}
    >
      {segments.length > 0 ? (
        <ol className="m-0 flex min-w-0 list-none flex-wrap items-center gap-1 p-0">
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const pathSoFar = segments.slice(0, index + 1).join("/");
            return (
              <li
                className="inline-flex min-w-0 items-center gap-1"
                data-schema-breadcrumb-segment={segment}
                key={pathSoFar}
              >
                {index > 0 ? (
                  <span aria-hidden="true" className="text-muted-foreground">
                    /
                  </span>
                ) : null}
                <span
                  className={cn(
                    "min-w-0 truncate font-mono text-xs",
                    isLast ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {segment}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <code
          className="min-w-0 truncate font-mono text-muted-foreground text-xs"
          data-schema-breadcrumb-anchor=""
        >
          #{anchor}
        </code>
      )}

      <button
        aria-label={checked ? COPIED_LABEL : COPY_LABEL}
        className="inline-flex shrink-0 items-center justify-center rounded-md border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
        data-checked={checked || undefined}
        data-schema-breadcrumb="copy"
        onClick={onClick}
        type="button"
      >
        {checked ? (
          <Check aria-hidden="true" />
        ) : (
          <Clipboard aria-hidden="true" />
        )}
      </button>
      <span
        aria-live="polite"
        className="sr-only"
        data-schema-deep-link-copy-status=""
      >
        {checked ? COPIED_LABEL : ""}
      </span>
    </nav>
  );
}
