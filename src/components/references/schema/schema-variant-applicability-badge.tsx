/**
 * Selected / excluded / conditional applicability badge for variant fields.
 * Always shows text — never color-only meaning.
 */

import { cn } from "@/lib/utils";
import {
  type SchemaVariantFieldApplicability,
  schemaVariantApplicabilityLabel,
} from "./schema-variant-display";

export type SchemaVariantApplicabilityBadgeProps = {
  applicability: SchemaVariantFieldApplicability;
  className?: string;
  "data-testid"?: string;
};

export function SchemaVariantApplicabilityBadge({
  applicability,
  className,
  "data-testid": testId = "schema-variant-applicability-badge",
}: SchemaVariantApplicabilityBadgeProps) {
  const label = schemaVariantApplicabilityLabel(applicability);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs",
        applicability === "selected"
          ? "bg-muted/60 text-foreground"
          : applicability === "excluded"
            ? "bg-background text-muted-foreground line-through decoration-muted-foreground/70"
            : "bg-background text-muted-foreground",
        className,
      )}
      data-schema-variant-applicability={applicability}
      data-testid={testId}
    >
      {label}
    </span>
  );
}
