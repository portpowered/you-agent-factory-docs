/**
 * JavaScript-owned presentation helpers for shared-schema cards and Symbols
 * list dedupe. Keeps SchemaDefinitionEmbed / MCP surfaces untouched.
 */

import type {
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
} from "@/lib/references/family-normalized-models";
import type { SchemaDefinitionModel } from "@/lib/references/schema-model";

/**
 * True when a symbol duplicates a shared-schema identity and should stay under
 * Shared schemas only (not also clutter the Symbols list).
 *
 * Matches by shared-schema id, or by a source pointer under `/sharedSchemas/`.
 */
export function isJavascriptSymbolDuplicatingSharedSchema(
  symbol: JavascriptSymbolNormalized,
  sharedSchemas: readonly JavascriptSharedSchemaNormalized[],
): boolean {
  if (sharedSchemas.some((schema) => schema.id === symbol.id)) {
    return true;
  }
  return symbol.source.pointer.startsWith("/sharedSchemas/");
}

/** Symbols list after dropping shared-schema duplicates. */
export function filterJavascriptSymbolsExcludingSharedSchemaDuplicates(
  symbols: readonly JavascriptSymbolNormalized[],
  sharedSchemas: readonly JavascriptSharedSchemaNormalized[],
): JavascriptSymbolNormalized[] {
  return symbols.filter(
    (symbol) =>
      !isJavascriptSymbolDuplicatingSharedSchema(symbol, sharedSchemas),
  );
}

/**
 * Strip card-chrome fields that duplicate the shared-schema heading / identity
 * so SchemaDefinitionEmbed can still render properties without requiring MCP
 * edits to the shared embed primitive.
 *
 * Omits title, type, and additionalProperties (object policy). Keeps
 * properties, required, composition, refs, and description when published.
 */
export function trimJavascriptSharedSchemaDefinitionForCard(
  definition: SchemaDefinitionModel,
): SchemaDefinitionModel {
  const {
    title: _title,
    type: _type,
    additionalProperties: _additionalProperties,
    ...rest
  } = definition;
  return rest;
}
