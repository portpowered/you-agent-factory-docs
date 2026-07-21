/**
 * On-page glossary copy for JavaScript symbol metadata pills.
 *
 * Kept as JavaScript-owned English definitions (not nested page-message
 * objects) because page sections only accept `title` / `body` strings.
 * Definitions cover published contract vocabulary only — no invented enums.
 */

import type { JavascriptSymbolMetadataFacet } from "./javascript-symbol-metadata";
import { JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_ANCHORS } from "./javascript-symbol-metadata";

export type JavascriptSymbolMetadataGlossaryTerm = {
  facet: JavascriptSymbolMetadataFacet;
  anchor: string;
  term: string;
  definition: string;
};

export const JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_TERMS: readonly JavascriptSymbolMetadataGlossaryTerm[] =
  [
    {
      facet: "kind",
      anchor: JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_ANCHORS.kind,
      term: "Kind",
      definition:
        "Kind classifies what the published symbol is. A Value is a bound data binding such as args or meta. A function is a callable runtime helper such as log. Namespace and method kinds appear only when the contract publishes those shapes.",
    },
    {
      facet: "mutability",
      anchor: JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_ANCHORS.mutability,
      term: "Mutability",
      definition:
        "Mutability describes whether the bound object may change after bind. Mutable object means the binding exposes an object authors can update. Fixed binding means the binding identity stays fixed for the published lifetime.",
    },
    {
      facet: "nullability",
      anchor: JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_ANCHORS.nullability,
      term: "Nullability",
      definition:
        "Nullability describes whether the binding may be null. Non-null means the published contract treats the binding as always present when that field is published.",
    },
    {
      facet: "bindingLifecycle",
      anchor: JAVASCRIPT_SYMBOL_METADATA_GLOSSARY_ANCHORS.bindingLifecycle,
      term: "Binding lifecycle",
      definition:
        "Binding lifecycle describes how the binding relates to the workflow run. Snapshot at bind captures the value when the binding is established. Live namespace stays connected to the live namespace surface for the published lifetime.",
    },
  ] as const;
