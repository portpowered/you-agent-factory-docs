/**
 * Type / format / nullable presentation for schema fields.
 * Meaning is carried by text labels; theme tokens only style, never encode
 * required semantics alone.
 */

import type { ReferenceDisplayProjection } from "@/lib/references/reference-display-projection";
import { cn } from "@/lib/utils";

export type SchemaTypeBadgeProps = {
  /** Compact type summary from the field/definition display projection. */
  typeSummary?: string;
  format?: string;
  nullable?: boolean;
  className?: string;
  "data-testid"?: string;
};

/** Build type-badge props from a W04 display projection. */
export function schemaTypeBadgePropsFromProjection(
  projection: Pick<
    ReferenceDisplayProjection,
    "typeSummary" | "format" | "nullable"
  >,
): SchemaTypeBadgeProps {
  const props: SchemaTypeBadgeProps = {};
  if (projection.typeSummary !== undefined) {
    props.typeSummary = projection.typeSummary;
  }
  if (projection.format !== undefined) {
    props.format = projection.format;
  }
  if (projection.nullable !== undefined) {
    props.nullable = projection.nullable;
  }
  return props;
}

export function SchemaTypeBadge({
  typeSummary,
  format,
  nullable,
  className,
  "data-testid": testId = "schema-type-badge",
}: SchemaTypeBadgeProps) {
  if (typeSummary === undefined && format === undefined && nullable !== true) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 text-sm text-foreground",
        className,
      )}
      data-testid={testId}
    >
      {typeSummary !== undefined ? (
        <span
          className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-foreground"
          data-schema-type="summary"
        >
          {typeSummary}
        </span>
      ) : null}
      {format !== undefined ? (
        <span
          className="rounded-md border border-border px-1.5 py-0.5 font-mono text-muted-foreground text-xs"
          data-schema-type="format"
        >
          format: {format}
        </span>
      ) : null}
      {nullable === true ? (
        <span
          className="rounded-md border border-border px-1.5 py-0.5 text-muted-foreground text-xs"
          data-schema-type="nullable"
        >
          nullable
        </span>
      ) : null}
    </span>
  );
}
