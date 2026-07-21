/**
 * Pure display projectors for schema examples.
 *
 * W04 `SchemaDefinitionModel.examples` is a plain `unknown[]` without
 * provenance. Callers that know authored vs generated origin pass annotated
 * entries so the UI can label them; otherwise origin stays unset and the UI
 * must not claim "authored".
 */

import type { ReferenceChromeMessages } from "@/lib/content/ui-messages.types";
import { formatReferenceChromeTemplate } from "@/lib/i18n/reference-chrome-labels";
import { formatSchemaValue } from "./format-schema-value";

/** Known example provenance when the caller can distinguish sources. */
export const SCHEMA_EXAMPLE_ORIGINS = ["authored", "generated"] as const;

export type SchemaExampleOrigin = (typeof SCHEMA_EXAMPLE_ORIGINS)[number];

/**
 * One example ready for CodePanel rendering. `code` is already formatted;
 * `origin` is absent when provenance is unknown.
 */
export type SchemaExampleDisplay = {
  /** Stable key for list rendering (caller-owned or derived index label). */
  id: string;
  /** Formatted JSON/YAML/text for CodePanel body and clipboard copy. */
  code: string;
  /** Optional language hint for labeling (for example `json` or `yaml`). */
  language?: string;
  /** Present only when the caller knows authored vs generated. */
  origin?: SchemaExampleOrigin;
  /** Optional short label (for example "Example 1"). */
  label?: string;
};

/** Annotated example input before formatting. */
export type SchemaExampleInput = {
  value: unknown;
  origin?: SchemaExampleOrigin;
  language?: string;
  label?: string;
  id?: string;
};

export type ProjectSchemaExamplesOptions = {
  /** Default language when an entry omits one. */
  language?: string;
  /** Localized chrome for example index labels. */
  chrome?: ReferenceChromeMessages;
};

/**
 * Human-readable provenance label. Returns undefined when origin is unknown
 * so the UI does not silently treat examples as authored.
 */
export function schemaExampleOriginLabel(
  origin: SchemaExampleOrigin | undefined,
  chrome?: ReferenceChromeMessages,
): string | undefined {
  if (origin === "authored") {
    return chrome?.examples.authored ?? "Authored example";
  }
  if (origin === "generated") {
    return chrome?.examples.generated ?? "Generated example";
  }
  return undefined;
}

/**
 * Project raw W04 `examples` values into display entries without inventing
 * provenance. Empty/undefined input yields an empty list (no fabricated
 * payloads).
 */
export function projectSchemaExamplesFromValues(
  values: readonly unknown[] | undefined,
  options: ProjectSchemaExamplesOptions = {},
): SchemaExampleDisplay[] {
  if (values === undefined || values.length === 0) {
    return [];
  }

  return values.map((value, index) => {
    const display: SchemaExampleDisplay = {
      id: `example-${index + 1}`,
      code: formatSchemaValue(value),
      label: formatReferenceChromeTemplate(
        options.chrome?.examples.exampleIndexed ?? "Example {index}",
        { index: index + 1 },
      ),
    };
    if (options.language !== undefined) {
      display.language = options.language;
    }
    return display;
  });
}

/**
 * Project annotated example inputs (with optional authored/generated origin)
 * into CodePanel-ready display entries. Does not invent values or origins.
 */
export function projectSchemaExamplesFromInputs(
  inputs: readonly SchemaExampleInput[] | undefined,
  options: ProjectSchemaExamplesOptions = {},
): SchemaExampleDisplay[] {
  if (inputs === undefined || inputs.length === 0) {
    return [];
  }

  return inputs.map((input, index) => {
    const display: SchemaExampleDisplay = {
      id: input.id ?? `example-${index + 1}`,
      code: formatSchemaValue(input.value),
      label:
        input.label ??
        formatReferenceChromeTemplate(
          options.chrome?.examples.exampleIndexed ?? "Example {index}",
          { index: index + 1 },
        ),
    };
    const language = input.language ?? options.language;
    if (language !== undefined) {
      display.language = language;
    }
    if (input.origin !== undefined) {
      display.origin = input.origin;
    }
    return display;
  });
}
