import { assertFactoryRelatedLinkItems } from "@/lib/content/factory-prev-next-related";
import {
  PUBLISHED_DOCS_REGISTRY_IDS,
  type PublishedDocsRegistryIds,
} from "@/lib/content/published-docs-registry-ids";
import {
  hasPublishedDocsPageForRecord,
  registryDisplayTitle,
  registryRecordHref,
} from "@/lib/content/registry-linking";
import { getRegistryRecordById } from "@/lib/content/registry-runtime";
import type { RelatedRegistryRecord } from "@/lib/content/related-docs";
import { resolveDocumentationRouteMigrationPreferredRegistryId } from "@/lib/seo/documentation-route-migration";

export type RelatedRegistryDocUnavailableReason = "missing" | "unpublished";

export type RelatedRegistryDocLinkItem = {
  registryId: string;
  title: string;
  href: string;
};

export type RelatedRegistryDocUnavailableItem = {
  registryId: string;
  reason: RelatedRegistryDocUnavailableReason;
};

export type ResolveRelatedRegistryDocsResult = {
  available: RelatedRegistryDocLinkItem[];
  unavailable: RelatedRegistryDocUnavailableItem[];
};

export type ResolveRelatedRegistryDocsOptions = {
  publishedRegistryIds?: PublishedDocsRegistryIds;
  getRecordById?: (registryId: string) => RelatedRegistryRecord | undefined;
};

/**
 * Resolves explicit registry ids to published docs-page link data.
 * Input order is preserved for both available and unavailable results.
 */
export function resolveRelatedRegistryDocs(
  registryIds: readonly string[],
  options: ResolveRelatedRegistryDocsOptions = {},
): ResolveRelatedRegistryDocsResult {
  const publishedRegistryIds =
    options.publishedRegistryIds ?? PUBLISHED_DOCS_REGISTRY_IDS;
  const getRecordById = options.getRecordById ?? getRegistryRecordById;

  const available: RelatedRegistryDocLinkItem[] = [];
  const unavailable: RelatedRegistryDocUnavailableItem[] = [];

  for (const registryId of registryIds) {
    // Prefer published family identities over §10 compatibility-page ids when
    // a preferred mapping exists (api-doc → reference.api, etc.).
    const resolvedRegistryId =
      resolveDocumentationRouteMigrationPreferredRegistryId(registryId);
    const record = getRecordById(resolvedRegistryId);
    if (!record) {
      unavailable.push({ registryId: resolvedRegistryId, reason: "missing" });
      continue;
    }

    if (!hasPublishedDocsPageForRecord(record, publishedRegistryIds)) {
      unavailable.push({
        registryId: resolvedRegistryId,
        reason: "unpublished",
      });
      continue;
    }

    const href = registryRecordHref(record);
    if (!href) {
      unavailable.push({
        registryId: resolvedRegistryId,
        reason: "unpublished",
      });
      continue;
    }

    available.push({
      registryId: resolvedRegistryId,
      title: registryDisplayTitle(record),
      // registryRecordHref already remaps §10 old documentation URLs to family
      // destinations (workers/workstations href-remap-only ids included).
      href,
    });
  }

  assertFactoryRelatedLinkItems(available);
  return { available, unavailable };
}
