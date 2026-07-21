/**
 * Required / optional state for schema fields.
 * Always shows text — never color-only meaning.
 */

import { cn } from "@/lib/utils";

export type SchemaRequiredBadgeProps = {
  required: boolean;
  className?: string;
  "data-testid"?: string;
};

export function SchemaRequiredBadge({
  required,
  className,
  "data-testid": testId = "schema-required-badge",
}: SchemaRequiredBadgeProps) {
  const label = required ? "Required" : "Optional";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs",
        required
          ? "bg-muted/60 text-foreground"
          : "bg-background text-muted-foreground",
        className,
      )}
      data-schema-required={required ? "true" : "false"}
      data-testid={testId}
    >
      {required ? (
        <span aria-hidden="true" className="font-semibold text-foreground">
          *
        </span>
      ) : null}
      <span>{label}</span>
    </span>
  );
}
