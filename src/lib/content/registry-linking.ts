import {
  getPublishedDocsHrefForRecord,
  type PublishedDocsRegistryIds,
} from "@/lib/content/published-docs-registry-ids";
import type {
  CitationRecord,
  ClassificationRecord,
  ConceptRecord,
  DatasetRecord,
  DocumentationRecord,
  GraphRecord,
  GuideRecord,
  OrganizationRecord,
  ReferenceRecord,
  TagRecord,
  TechniqueRecord,
} from "@/lib/content/schemas";
import { remapDocumentationRouteMigrationDestinationHref } from "@/lib/seo/documentation-route-migration";

export type LinkableRegistryRecord =
  | ConceptRecord
  | GuideRecord
  | TechniqueRecord
  | DocumentationRecord
  | ReferenceRecord
  | ClassificationRecord
  | DatasetRecord
  | OrganizationRecord
  | CitationRecord
  | TagRecord
  | GraphRecord;

function formatSlugLabel(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function registryDisplayTitle(record: LinkableRegistryRecord): string {
  return record.aliases[0] ?? formatSlugLabel(record.slug);
}

export function registryRecordHref(
  record: LinkableRegistryRecord,
): string | undefined {
  if (
    record.kind === "concept" ||
    record.kind === "guide" ||
    record.kind === "technique" ||
    record.kind === "documentation" ||
    record.kind === "reference"
  ) {
    const publishedHref = getPublishedDocsHrefForRecord(record);
    if (!publishedHref) {
      return undefined;
    }
    // W18 move stubs stay published for bookmarks; reader-facing registry
    // links prefer the ledger family destination instead of the stub URL.
    return remapDocumentationRouteMigrationDestinationHref(publishedHref);
  }
  return undefined;
}

export function hasPublishedDocsPageForRecord(
  record: LinkableRegistryRecord,
  publishedRegistryIds: PublishedDocsRegistryIds,
): boolean {
  if (
    record.kind === "dataset" ||
    record.kind === "organization" ||
    record.kind === "classification"
  ) {
    return false;
  }
  return publishedRegistryIds.has(record.id);
}
