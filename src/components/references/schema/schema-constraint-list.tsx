/**
 * Renders published constraint facts (enum, const, pattern, range, length,
 * item count, uniqueness, additionalProperties). Absent constraints omit
 * entries — never invent values.
 */

import type { ReferenceDisplayProjection } from "@/lib/references/reference-display-projection";
import type {
  SchemaAdditionalPropertiesModel,
  SchemaConstraintsModel,
  SchemaFieldModel,
} from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import {
  listSchemaConstraintEntries,
  type SchemaConstraintSource,
} from "./schema-constraint-entries";

export type SchemaConstraintListProps = {
  constraints?: SchemaConstraintsModel;
  enum?: unknown[];
  const?: unknown;
  additionalProperties?: SchemaAdditionalPropertiesModel;
  className?: string;
  "data-testid"?: string;
};

/** Build constraint-list props from a W04 field model. */
export function schemaConstraintListPropsFromField(
  field: Pick<
    SchemaFieldModel,
    "constraints" | "enum" | "const" | "additionalProperties"
  >,
): SchemaConstraintListProps {
  const props: SchemaConstraintListProps = {};
  if (field.constraints !== undefined) {
    props.constraints = field.constraints;
  }
  if (field.enum !== undefined) {
    props.enum = field.enum;
  }
  if (field.const !== undefined) {
    props.const = field.const;
  }
  if (field.additionalProperties !== undefined) {
    props.additionalProperties = field.additionalProperties;
  }
  return props;
}

/**
 * Build constraint-list props from a display projection plus optional field
 * facts that projections do not carry (`const`, `additionalProperties`).
 */
export function schemaConstraintListPropsFromProjection(
  projection: Pick<ReferenceDisplayProjection, "constraints" | "enum">,
  extras: Pick<
    SchemaConstraintListProps,
    "const" | "additionalProperties"
  > = {},
): SchemaConstraintListProps {
  const props: SchemaConstraintListProps = {};
  if (projection.constraints !== undefined) {
    props.constraints = projection.constraints;
  }
  if (projection.enum !== undefined) {
    props.enum = projection.enum;
  }
  if (extras.const !== undefined) {
    props.const = extras.const;
  }
  if (extras.additionalProperties !== undefined) {
    props.additionalProperties = extras.additionalProperties;
  }
  return props;
}

export function SchemaConstraintList({
  constraints,
  enum: enumValues,
  const: constValue,
  additionalProperties,
  className,
  "data-testid": testId = "schema-constraint-list",
}: SchemaConstraintListProps) {
  const source: SchemaConstraintSource = {};
  if (constraints !== undefined) {
    source.constraints = constraints;
  }
  if (enumValues !== undefined) {
    source.enum = enumValues;
  }
  if (constValue !== undefined) {
    source.const = constValue;
  }
  if (additionalProperties !== undefined) {
    source.additionalProperties = additionalProperties;
  }

  const entries = listSchemaConstraintEntries(source);
  if (entries.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Schema constraints"
      className={cn(
        "m-0 list-none space-y-1 p-0 text-muted-foreground text-sm",
        className,
      )}
      data-testid={testId}
    >
      {entries.map((entry) => (
        <li
          className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5"
          data-schema-constraint={entry.key}
          key={entry.key}
        >
          <span className="shrink-0 font-medium text-foreground">
            {entry.label}
          </span>
          <code className="min-w-0 overflow-x-auto break-all font-mono text-foreground text-xs">
            {entry.value}
          </code>
        </li>
      ))}
    </ul>
  );
}
