/**
 * Accessible HTTP method badge for harness / custom-section fixtures.
 *
 * Not part of the published Fumadocs `ApiReferenceAPIPage` path — deep-import
 * only (not re-exported from `@/features/references/api`).
 *
 * Meaning is carried by the method text itself; theme tokens only style.
 * Never rely on color alone to communicate GET vs POST vs DELETE.
 */

import type { OpenApiHttpMethod } from "@/lib/references/family-normalized-models";
import { cn } from "@/lib/utils";
import { apiMethodBadgeToneClass } from "./theme-tokens";

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
        apiMethodBadgeToneClass(method),
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
