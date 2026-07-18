/**
 * Build live Orama `SearchDocument` records from settled reference inventories
 * via W04/W09 search shapes (W16).
 *
 * Story 002 wires the adapter + locale build path. Later W16 stories add
 * API/schema/CLI/MCP/JavaScript family loaders into `loadSettledReferenceSearchShapes`.
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
 * Collect settled reference search shapes for Orama adaptation.
 * Currently includes the events corpus; other families land in later stories.
 */
export function loadSettledReferenceSearchShapes(): ReferenceSearchDocumentShape[] {
  return loadEventCorpusReferenceSearchShapes().shapes;
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
