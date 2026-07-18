/**
 * Pure projection of published field/definition constraint facts into labeled
 * display entries. Absent source fields stay omitted — never invent limits.
 */

import type {
  SchemaAdditionalPropertiesModel,
  SchemaConstraintsModel,
} from "@/lib/references/schema-model";
import { formatSchemaValue } from "./format-schema-value";

export type SchemaConstraintEntry = {
  /** Stable machine key for tests / data attributes. */
  key: string;
  /** Human-readable constraint label (for example `pattern`, `minimum`). */
  label: string;
  /** Formatted value text shown next to the label. */
  value: string;
};

export type SchemaConstraintSource = {
  constraints?: SchemaConstraintsModel;
  enum?: unknown[];
  const?: unknown;
  additionalProperties?: SchemaAdditionalPropertiesModel;
};

function formatAdditionalProperties(
  value: SchemaAdditionalPropertiesModel,
): string {
  if (typeof value === "boolean") {
    return value ? "true (open)" : "false (closed)";
  }
  return value.pointer;
}

/**
 * Build ordered constraint entries from published model fields only.
 * Does not invent enum/const/pattern/range values when the source omitted them.
 */
export function listSchemaConstraintEntries(
  source: SchemaConstraintSource,
): SchemaConstraintEntry[] {
  const entries: SchemaConstraintEntry[] = [];

  if (source.enum !== undefined && source.enum.length > 0) {
    entries.push({
      key: "enum",
      label: "enum",
      value: source.enum.map((item) => formatSchemaValue(item)).join(" | "),
    });
  }

  if (source.const !== undefined) {
    entries.push({
      key: "const",
      label: "const",
      value: formatSchemaValue(source.const),
    });
  }

  const constraints = source.constraints;
  if (constraints !== undefined) {
    if (constraints.pattern !== undefined) {
      entries.push({
        key: "pattern",
        label: "pattern",
        value: constraints.pattern,
      });
    }

    const rangeKeys = [
      "minimum",
      "maximum",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
    ] as const;
    for (const key of rangeKeys) {
      if (constraints[key] !== undefined) {
        entries.push({
          key,
          label: key,
          value: String(constraints[key]),
        });
      }
    }

    if (constraints.minLength !== undefined) {
      entries.push({
        key: "minLength",
        label: "minLength",
        value: String(constraints.minLength),
      });
    }
    if (constraints.maxLength !== undefined) {
      entries.push({
        key: "maxLength",
        label: "maxLength",
        value: String(constraints.maxLength),
      });
    }

    if (constraints.minItems !== undefined) {
      entries.push({
        key: "minItems",
        label: "minItems",
        value: String(constraints.minItems),
      });
    }
    if (constraints.maxItems !== undefined) {
      entries.push({
        key: "maxItems",
        label: "maxItems",
        value: String(constraints.maxItems),
      });
    }

    if (constraints.uniqueItems !== undefined) {
      entries.push({
        key: "uniqueItems",
        label: "uniqueItems",
        value: String(constraints.uniqueItems),
      });
    }

    if (constraints.minProperties !== undefined) {
      entries.push({
        key: "minProperties",
        label: "minProperties",
        value: String(constraints.minProperties),
      });
    }
    if (constraints.maxProperties !== undefined) {
      entries.push({
        key: "maxProperties",
        label: "maxProperties",
        value: String(constraints.maxProperties),
      });
    }
  }

  if (source.additionalProperties !== undefined) {
    entries.push({
      key: "additionalProperties",
      label: "additionalProperties",
      value: formatAdditionalProperties(source.additionalProperties),
    });
  }

  return entries;
}
