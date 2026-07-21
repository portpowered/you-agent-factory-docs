/**
 * Build live Orama `SearchDocument` records from settled reference inventories
 * via W04/W09 search shapes (W16).
 *
 * Story 002 wired the adapter + locale build path with the events corpus.
 * Story 003 adds API operation and schema definition/field loaders.
 * Story 004 adds CLI command, MCP tool, and JavaScript runtime loaders.
 */

import {
  buildEventCorpusSearchDocuments,
  buildFactoryEventCatalog,
  buildFactoryResponseEventCatalog,
  type EventCorpusSearchDocumentsResult,
  eventsOpenApiTurbopackLoadDependencies,
  resolveEventCorpus,
} from "@/lib/references/events";
import type { ReferenceSearchDocumentShape } from "@/lib/references/reference-search-projection";
import { adaptReferenceSearchShapesToSearchDocuments } from "./adapt-reference-search-document";
import {
  type ApiOperationSearchDocumentsResult,
  loadApiOperationReferenceSearchShapes,
} from "./build-api-reference-search-documents";
import {
  type CliCommandSearchDocumentsResult,
  type JavascriptRuntimeSearchDocumentsResult,
  loadCliCommandReferenceSearchShapes,
  loadJavascriptRuntimeReferenceSearchShapes,
  loadMcpToolReferenceSearchShapes,
  type McpToolSearchDocumentsResult,
} from "./build-cli-mcp-javascript-reference-search-documents";
import {
  loadSchemaReferenceSearchShapes,
  type SchemaReferenceSearchDocumentsResult,
} from "./build-schema-reference-search-documents";
import type { SearchDocument } from "./types";

export type BuildReferenceItemSearchDocumentsOptions = {
  /** Inject pre-built shapes (tests / partial inventories). */
  shapes?: readonly ReferenceSearchDocumentShape[];
  /** Override shape loader (defaults to settled inventory projection). */
  loadShapes?: () => readonly ReferenceSearchDocumentShape[];
  /** Bypass process cache when building from live inventories. */
  fresh?: boolean;
};

let cachedReferenceItemDocuments: SearchDocument[] | undefined;

/**
 * Load W09 event-corpus search shapes from packaged OpenAPI and register
 * anchors via the shared registry helpers inside `buildEventCorpusSearchDocuments`.
 */
export function loadEventCorpusReferenceSearchShapes(): {
  shapes: ReferenceSearchDocumentShape[];
  corpus: EventCorpusSearchDocumentsResult;
} {
  const resolved = resolveEventCorpus({
    loadDependencies: eventsOpenApiTurbopackLoadDependencies(),
  });
  const factoryEventCatalog = buildFactoryEventCatalog(
    resolved.openapi.document,
  );
  const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
    resolved.openapi.document,
  );
  const corpus = buildEventCorpusSearchDocuments(
    factoryEventCatalog,
    factoryResponseEventCatalog,
  );
  return { shapes: corpus.documents, corpus };
}

/**
 * Load published OpenAPI operation search shapes with registry anchors on
 * `/docs/references/api`.
 */
export function loadApiReferenceSearchShapes(): {
  shapes: ReferenceSearchDocumentShape[];
  corpus: ApiOperationSearchDocumentsResult;
} {
  const corpus = loadApiOperationReferenceSearchShapes();
  return { shapes: corpus.documents, corpus };
}

/**
 * Load settled schema definition/field search shapes with per-page anchors on
 * factory-schema / system-config-schema / mock-workers-schema.
 */
export function loadSchemaFamilyReferenceSearchShapes(): {
  shapes: ReferenceSearchDocumentShape[];
  corpus: SchemaReferenceSearchDocumentsResult;
} {
  const corpus = loadSchemaReferenceSearchShapes();
  return { shapes: corpus.documents, corpus };
}

/**
 * Load published CLI command search shapes with registry anchors on
 * `/docs/references/cli`.
 */
export function loadCliReferenceSearchShapes(): {
  shapes: ReferenceSearchDocumentShape[];
  corpus: CliCommandSearchDocumentsResult;
} {
  const corpus = loadCliCommandReferenceSearchShapes();
  return { shapes: corpus.documents, corpus };
}

/**
 * Load published MCP tool search shapes with registry anchors on
 * `/docs/references/mcp-reference`.
 */
export function loadMcpReferenceSearchShapes(): {
  shapes: ReferenceSearchDocumentShape[];
  corpus: McpToolSearchDocumentsResult;
} {
  const corpus = loadMcpToolReferenceSearchShapes();
  return { shapes: corpus.documents, corpus };
}

/**
 * Load published JavaScript runtime symbol / shared-schema search shapes with
 * registry anchors on `/docs/references/javascript-runtime`.
 */
export function loadJavascriptReferenceSearchShapes(): {
  shapes: ReferenceSearchDocumentShape[];
  corpus: JavascriptRuntimeSearchDocumentsResult;
} {
  const corpus = loadJavascriptRuntimeReferenceSearchShapes();
  return { shapes: corpus.documents, corpus };
}

/**
 * Collect settled reference search shapes for Orama adaptation.
 * Includes events, API operations, schema definitions/fields, CLI commands,
 * MCP tools, and JavaScript runtime symbols / shared schemas.
 */
export function loadSettledReferenceSearchShapes(): ReferenceSearchDocumentShape[] {
  return [
    ...loadEventCorpusReferenceSearchShapes().shapes,
    ...loadApiReferenceSearchShapes().shapes,
    ...loadSchemaFamilyReferenceSearchShapes().shapes,
    ...loadCliReferenceSearchShapes().shapes,
    ...loadMcpReferenceSearchShapes().shapes,
    ...loadJavascriptReferenceSearchShapes().shapes,
  ];
}

/**
 * Adapt settled (or injected) reference search shapes into live SearchDocuments.
 */
export function buildReferenceItemSearchDocuments(
  options: BuildReferenceItemSearchDocumentsOptions = {},
): SearchDocument[] {
  if (options.shapes !== undefined) {
    return adaptReferenceSearchShapesToSearchDocuments(options.shapes);
  }

  if (options.loadShapes !== undefined) {
    return adaptReferenceSearchShapesToSearchDocuments(options.loadShapes());
  }

  if (!options.fresh && cachedReferenceItemDocuments !== undefined) {
    return cachedReferenceItemDocuments;
  }

  const documents = adaptReferenceSearchShapesToSearchDocuments(
    loadSettledReferenceSearchShapes(),
  );
  cachedReferenceItemDocuments = documents;
  return documents;
}

/** Test helper: clear the process-scoped reference-item document cache. */
export function resetReferenceItemSearchDocumentsCacheForTests(): void {
  cachedReferenceItemDocuments = undefined;
}
