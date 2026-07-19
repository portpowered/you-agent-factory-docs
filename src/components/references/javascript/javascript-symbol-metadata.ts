/**
 * Pure helpers for JavaScript symbol metadata pills (kind, mutability,
 * nullability, binding lifecycle). Display labels format published contract
 * values only — never invent unpublished enum members.
 */

/** Known published kind values from the JavaScript runtime contract. */
export const JAVASCRIPT_SYMBOL_KIND_LABELS = {
  value: "Value",
  function: "Function",
  namespace: "Namespace",
  method: "Method",
} as const;

/** Known published mutability values. */
export const JAVASCRIPT_SYMBOL_MUTABILITY_LABELS = {
  "mutable-object": "Mutable object",
  "fixed-binding": "Fixed binding",
} as const;

/** Known published nullability values. */
export const JAVASCRIPT_SYMBOL_NULLABILITY_LABELS = {
  "non-null": "Non-null",
} as const;

/** Known published binding-lifecycle values. */
export const JAVASCRIPT_SYMBOL_BINDING_LIFECYCLE_LABELS = {
  "snapshot-at-bind": "Snapshot at bind",
  "live-namespace": "Live namespace",
} as const;

function titleCaseContractToken(value: string): string {
  return value
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function labelFromKnownMap(
  value: string,
  known: Readonly<Record<string, string>>,
): string {
  return known[value] ?? titleCaseContractToken(value);
}

/** Human-readable kind pill value; falls back to formatted contract string. */
export function javascriptSymbolKindLabel(kind: string): string {
  return labelFromKnownMap(kind, JAVASCRIPT_SYMBOL_KIND_LABELS);
}

/** Human-readable mutability pill value. */
export function javascriptSymbolMutabilityLabel(mutability: string): string {
  return labelFromKnownMap(mutability, JAVASCRIPT_SYMBOL_MUTABILITY_LABELS);
}

/** Human-readable nullability pill value. */
export function javascriptSymbolNullabilityLabel(nullability: string): string {
  return labelFromKnownMap(nullability, JAVASCRIPT_SYMBOL_NULLABILITY_LABELS);
}

/** Human-readable binding-lifecycle pill value. */
export function javascriptSymbolBindingLifecycleLabel(
  bindingLifecycle: string,
): string {
  return labelFromKnownMap(
    bindingLifecycle,
    JAVASCRIPT_SYMBOL_BINDING_LIFECYCLE_LABELS,
  );
}

export type JavascriptSymbolMetadataFacet =
  | "kind"
  | "mutability"
  | "nullability"
  | "bindingLifecycle";

export const JAVASCRIPT_SYMBOL_METADATA_FACET_LABELS: Record<
  JavascriptSymbolMetadataFacet,
  string
> = {
  kind: "Kind",
  mutability: "Mutability",
  nullability: "Nullability",
  bindingLifecycle: "Binding lifecycle",
};

/** Stable on-page glossary anchors for each metadata facet. */
export const JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_ANCHORS: Record<
  JavascriptSymbolMetadataFacet,
  string
> = {
  kind: "glossary-kind",
  mutability: "glossary-mutability",
  nullability: "glossary-nullability",
  bindingLifecycle: "glossary-binding-lifecycle",
};
