/**
 * Typed props and status vocabulary for the W07 shared JSON Schema UI surface.
 *
 * Components accept W04-normalized models and display projections (or thin
 * adapters over them). Raw package JSON and filesystem reads stay outside this
 * boundary — callers resolve/normalize first, then pass ready models here.
 */

import type { ReferenceDisplayProjection } from "@/lib/references/reference-display-projection";
import type {
  SchemaAddress,
  SchemaDefinitionModel,
  SchemaFieldModel,
} from "@/lib/references/schema-model";

/**
 * Non-ready outcomes the schema UI must render explicitly.
 * - `loading`: input is pending (normalization / acquisition in flight)
 * - `empty`: no definitions or fields to show
 * - `invalid`: validation/normalization failed for the supplied input
 * - `unsupported`: schema shape/version outcome this renderer cannot display
 */
export const SCHEMA_UI_STATUS_KINDS = [
  "loading",
  "empty",
  "invalid",
  "unsupported",
] as const;

export type SchemaUiStatusKind = (typeof SCHEMA_UI_STATUS_KINDS)[number];

/** Full surface status including the ready path for later composition stories. */
export type SchemaUiStatus = SchemaUiStatusKind | "ready";

/**
 * Thin typed adapter over a W04 display projection. Keeps the UI boundary on
 * projection shapes rather than raw package JSON.
 */
export type SchemaDisplayInput = {
  projection: ReferenceDisplayProjection;
};

/**
 * Thin typed adapter over a W04 definition model (optionally addressed).
 * Callers that already hold a normalized definition pass it here.
 */
export type SchemaDefinitionInput = {
  definition: SchemaDefinitionModel;
  /** Optional address when rendering an addressed subset of a larger schema. */
  address?: SchemaAddress;
};

/**
 * Thin typed adapter over W04 field models for field-tree stories.
 */
export type SchemaFieldInput = {
  fields: readonly SchemaFieldModel[];
};

/**
 * Overlay field applicability for SchemaVariantReference display.
 * Re-exported vocabulary lives on `schema-variant-display` — this alias keeps
 * the tree node typed without importing the full overlay presentation module.
 */
export type SchemaFieldVariantApplicability =
  | "selected"
  | "excluded"
  | "conditional";

/**
 * Tree node for recursive field rendering. Children are pre-resolved field
 * models (callers resolve `childTargets` / nested properties before render).
 * `$ref` nodes should omit children so the row shows SchemaRefLink instead of
 * recursing into the target.
 *
 * Optional `variantApplicability` / `variantHint` are UI-only annotations from
 * overlay-shaped presentation (SchemaVariantReference). They never replace
 * field descriptions or types from the base `SchemaFieldModel`.
 */
export type SchemaFieldTreeNode = {
  field: SchemaFieldModel;
  children?: readonly SchemaFieldTreeNode[];
  variantApplicability?: SchemaFieldVariantApplicability;
  /** Display-only overlay hint; never used as contract description prose. */
  variantHint?: string;
};

export type SchemaStatusProps = {
  kind: SchemaUiStatusKind;
  /** Short heading shown above the detail message when provided. */
  title?: string;
  /** Human-readable status detail. Required so messaging is never blank. */
  message: string;
  className?: string;
  "data-testid"?: string;
};

/** Default copy for each non-ready status when callers omit a custom message. */
export const SCHEMA_UI_STATUS_DEFAULT_MESSAGES: Record<
  SchemaUiStatusKind,
  string
> = {
  loading: "Loading schema…",
  empty: "No schema definitions or fields are available.",
  invalid: "Schema input failed validation or normalization.",
  unsupported: "This schema shape or version is not supported for display.",
};

export const SCHEMA_UI_STATUS_DEFAULT_TITLES: Record<
  SchemaUiStatusKind,
  string
> = {
  loading: "Loading",
  empty: "Empty schema",
  invalid: "Invalid schema",
  unsupported: "Unsupported schema",
};
