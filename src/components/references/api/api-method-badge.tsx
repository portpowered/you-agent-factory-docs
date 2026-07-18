/**
 * Accessible HTTP method badge for the W08 API operation surface.
 *
 * Meaning is carried by the method text itself; theme tokens only style.
 * Never rely on color alone to communicate GET vs POST vs DELETE.
 */

import type { OpenApiHttpMethod } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";

export const API_METHOD_BADGE_ATTR = "data-api-method-badge" as const;

export type ApiMethodBadgeProps = {
  method: OpenApiHttpMethod | string;
  className?: string;
  "data-testid"?: string;
};

/** Uppercase display label for an HTTP method. */
export function apiMethodBadgeLabel(method: string): string {
  return method.trim().toUpperCase();
}

function methodToneClass(method: string): string {
  switch (method.trim().toLowerCase()) {
    case "get":
      return "border-border bg-muted/60 text-foreground";
    case "post":
      return "border-border bg-muted text-foreground";
    case "put":
    case "patch":
      return "border-border bg-background text-foreground";
    case "delete":
      return "border-border bg-muted/40 text-foreground";
    default:
      return "border-border bg-muted/50 text-foreground";
  }
}

export function ApiMethodBadge({
  method,
  className,
  "data-testid": testId = "api-method-badge",
}: ApiMethodBadgeProps) {
  const label = apiMethodBadgeLabel(method);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wide",
        methodToneClass(method),
        className,
      )}
      data-api-method={label}
      data-testid={testId}
      title={`HTTP method ${label}`}
      {...{ [API_METHOD_BADGE_ATTR]: label }}
    >
      {label}
    </span>
  );
}
