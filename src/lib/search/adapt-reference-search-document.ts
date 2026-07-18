/**
 * Adapt W04/W09 `ReferenceSearchDocumentShape` records into live Orama
 * `SearchDocument` records for the factory search pipeline (W16).
 *
 * Pure mapping — does not load inventories, touch Orama, or invent anchors.
 * Owning-page paths and fragments must already be present on the shape
 * (from `ReferenceSearchDocumentBuilder` / event corpus builders).
 *
 * Alias enrichment (story 005): every item gets its title and registry
 * anchor as searchable aliases alongside shape-provided common names /
 * discriminator literals (for example event `type` values and payload
 * schema names). Does not invent competing IDs.
 */

import type { ReferenceSearchDocumentShape } from "@/lib/references/reference-search-projection";
import { REFERENCE_SEARCH_DOCUMENT_KIND } from "./factory-search-kinds";
import type { SearchDocument } from "./types";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "./types";

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

/**
 * Merge shape-provided aliases with identity strings (title + registry
 * anchor) so common names and literal discriminator values stay searchable.
 */
export function enrichReferenceItemAliases(
  shape: Pick<ReferenceSearchDocumentShape, "title" | "anchor" | "aliases">,
): string[] {
  return unique([shape.title, shape.anchor, ...shape.aliases]);
}

/**
 * Convert one reference search shape into a live `SearchDocument`.
 * Coerces absent description to `""` for Orama field contracts.
 */
export function adaptReferenceSearchShapeToSearchDocument(
  shape: ReferenceSearchDocumentShape,
): SearchDocument {
  if (shape.kind !== REFERENCE_SEARCH_DOCUMENT_KIND) {
    throw new Error(
      `Reference search shape kind must be "${REFERENCE_SEARCH_DOCUMENT_KIND}", received "${shape.kind}".`,
    );
  }
  if (!shape.url.includes("#")) {
    throw new Error(
      `Reference item search document URL must include a registry anchor fragment: ${shape.url}`,
    );
  }
  if (shape.anchor.trim().length === 0) {
    throw new Error(
      `Reference item search document requires a non-empty registry anchor (id=${shape.id}).`,
    );
  }

  const aliases = enrichReferenceItemAliases(shape);
  const tags = unique(shape.tags);
  const description = shape.description ?? "";

  return {
    id: shape.id,
    url: shape.url,
    kind: REFERENCE_SEARCH_DOCUMENT_KIND,
    title: shape.title,
    description,
    bodyText: shape.bodyText,
    headings: unique([shape.title, shape.anchor]),
    directAliases: aliases,
    aliases,
    tags,
    relatedIds: [...shape.relatedIds],
    facets: {
      kind: REFERENCE_SEARCH_DOCUMENT_KIND,
      tags,
    },
    topology: { ...EMPTY_SEARCH_DOCUMENT_TOPOLOGY },
  };
}

/**
 * Adapt many reference search shapes into live `SearchDocument` records.
 */
export function adaptReferenceSearchShapesToSearchDocuments(
  shapes: readonly ReferenceSearchDocumentShape[],
): SearchDocument[] {
  return shapes.map((shape) =>
    adaptReferenceSearchShapeToSearchDocument(shape),
  );
}
