import type { LocalizedContentVariantBinding } from "@/lib/content/localized-variant-identity";
import type {
  PublicSearchArtifact,
  PublicSearchArtifactEntry,
} from "@/lib/content/search-artifact";
import type { LocalizedSearchDocument } from "@/lib/content/search-document";
import type {
  CanonicalContentRecord,
  PublicContentKind,
} from "@/lib/content/types";
import { PUBLIC_CONTENT_KINDS } from "@/lib/content/types";

export type PublicContentValidationIssue = {
  code:
    | "missing_kind_coverage"
    | "duplicate_canonical_id"
    | "duplicate_route_path"
    | "missing_canonical_record"
    | "mismatched_variant_kind"
    | "duplicate_variant_locale"
    | "missing_canonical_locale_variant"
    | "missing_search_document"
    | "search_document_mismatch"
    | "stale_search_document"
    | "missing_search_artifact_entry"
    | "stale_search_artifact_entry"
    | "search_artifact_entry_mismatch";
  kind: PublicContentKind;
  message: string;
};

export type PublicContentValidationGraph = {
  canonicalRecords: readonly CanonicalContentRecord[];
  variantBindings: readonly LocalizedContentVariantBinding[];
  localizedSearchDocuments: readonly LocalizedSearchDocument[];
};

export function projectCanonicalRecordsForValidation(
  variantBindings: readonly LocalizedContentVariantBinding[],
): CanonicalContentRecord[] {
  const recordsByContentPathKey = new Map<string, CanonicalContentRecord>();

  for (const binding of variantBindings) {
    if (!recordsByContentPathKey.has(binding.contentPathKey)) {
      recordsByContentPathKey.set(binding.contentPathKey, binding.record);
    }
  }

  return [...recordsByContentPathKey.values()];
}

export type PublicContentValidationResult =
  | {
      ok: true;
      coveredKinds: PublicContentKind[];
      issues: [];
    }
  | {
      ok: false;
      coveredKinds: PublicContentKind[];
      issues: PublicContentValidationIssue[];
    };

function collectCoveredKinds(
  canonicalRecords: readonly CanonicalContentRecord[],
): PublicContentKind[] {
  const coveredKinds = new Set(canonicalRecords.map((record) => record.kind));
  return PUBLIC_CONTENT_KINDS.filter((kind) => coveredKinds.has(kind));
}

function validateCanonicalCoverage(
  coveredKinds: readonly PublicContentKind[],
): PublicContentValidationIssue[] {
  return PUBLIC_CONTENT_KINDS.flatMap((kind) =>
    coveredKinds.includes(kind)
      ? []
      : [
          {
            code: "missing_kind_coverage" as const,
            kind,
            message: `Public content validation is missing ${kind} coverage.`,
          },
        ],
  );
}

function validateCanonicalIds(
  canonicalRecords: readonly CanonicalContentRecord[],
): PublicContentValidationIssue[] {
  const seenRecords = new Map<string, CanonicalContentRecord>();
  const issues: PublicContentValidationIssue[] = [];

  for (const record of canonicalRecords) {
    const existingRecord = seenRecords.get(record.id);

    if (!existingRecord) {
      seenRecords.set(record.id, record);
      continue;
    }

    issues.push({
      code: "duplicate_canonical_id",
      kind: record.kind,
      message: `Canonical id "${record.id}" is duplicated between ${existingRecord.kind}:${existingRecord.slug} and ${record.kind}:${record.slug}.`,
    });
  }

  return issues;
}

function validateRouteIdentity(
  canonicalRecords: readonly CanonicalContentRecord[],
): PublicContentValidationIssue[] {
  const seenRoutes = new Map<string, CanonicalContentRecord>();
  const issues: PublicContentValidationIssue[] = [];

  for (const record of canonicalRecords) {
    const existingRecord = seenRoutes.get(record.routePath);

    if (!existingRecord) {
      seenRoutes.set(record.routePath, record);
      continue;
    }

    issues.push({
      code: "duplicate_route_path",
      kind: record.kind,
      message: `Public route "${record.routePath}" is claimed by canonical ids "${existingRecord.id}" and "${record.id}".`,
    });
  }

  return issues;
}

function validateLocalizedVariants(
  canonicalRecords: readonly CanonicalContentRecord[],
  variantBindings: readonly LocalizedContentVariantBinding[],
): PublicContentValidationIssue[] {
  const canonicalRecordsById = new Map(
    canonicalRecords.map((record) => [record.id, record]),
  );
  const seenVariantLocales = new Map<string, LocalizedContentVariantBinding>();
  const canonicalLocalesWithVariants = new Set<string>();
  const issues: PublicContentValidationIssue[] = [];

  for (const binding of variantBindings) {
    const canonicalRecord = canonicalRecordsById.get(binding.record.id);

    if (!canonicalRecord) {
      issues.push({
        code: "missing_canonical_record",
        kind: binding.record.kind,
        message: `Localized variant ${binding.contentPathKey} (${binding.variantLocale}) points to missing canonical id "${binding.record.id}".`,
      });
      continue;
    }

    if (binding.record.kind !== canonicalRecord.kind) {
      issues.push({
        code: "mismatched_variant_kind",
        kind: binding.record.kind,
        message: `Localized variant ${binding.contentPathKey} (${binding.variantLocale}) points to canonical id "${binding.record.id}" owned by ${canonicalRecord.kind}.`,
      });
    }

    const variantLocaleKey = `${binding.record.id}:${binding.variantLocale}`;
    const existingVariant = seenVariantLocales.get(variantLocaleKey);

    if (existingVariant) {
      issues.push({
        code: "duplicate_variant_locale",
        kind: binding.record.kind,
        message: `Canonical id "${binding.record.id}" has multiple localized variants for locale "${binding.variantLocale}": ${existingVariant.contentPathKey} and ${binding.contentPathKey}.`,
      });
      continue;
    }

    seenVariantLocales.set(variantLocaleKey, binding);

    if (binding.variantLocale === canonicalRecord.canonicalLocale) {
      canonicalLocalesWithVariants.add(canonicalRecord.id);
    }
  }

  for (const record of canonicalRecords) {
    if (canonicalLocalesWithVariants.has(record.id)) {
      continue;
    }

    issues.push({
      code: "missing_canonical_locale_variant",
      kind: record.kind,
      message: `Canonical id "${record.id}" is missing its canonical locale variant "${record.canonicalLocale}".`,
    });
  }

  return issues;
}

function buildExpectedSearchDocumentById(
  localizedSearchDocuments: readonly LocalizedSearchDocument[],
): Map<string, LocalizedSearchDocument> {
  return new Map(
    localizedSearchDocuments.map((document) => [document.id, document]),
  );
}

function hasMatchingSearchDocument(
  binding: LocalizedContentVariantBinding,
  document: LocalizedSearchDocument,
): boolean {
  return (
    document.canonicalId === binding.record.id &&
    document.locale === binding.variantLocale &&
    document.kind === binding.record.kind &&
    document.url === binding.record.routePath
  );
}

function validateSearchDocuments(
  variantBindings: readonly LocalizedContentVariantBinding[],
  localizedSearchDocuments: readonly LocalizedSearchDocument[],
): PublicContentValidationIssue[] {
  const documentsById = buildExpectedSearchDocumentById(
    localizedSearchDocuments,
  );
  const expectedBindingIds = new Set<string>();
  const issues: PublicContentValidationIssue[] = [];

  for (const binding of variantBindings) {
    const documentId = `${binding.record.id}@${binding.variantLocale}`;
    const document = documentsById.get(documentId);
    expectedBindingIds.add(documentId);

    if (!document) {
      issues.push({
        code: "missing_search_document",
        kind: binding.record.kind,
        message: `Localized search documents are missing ${binding.contentPathKey} for locale "${binding.variantLocale}" (canonical id "${binding.record.id}").`,
      });
      continue;
    }

    if (!hasMatchingSearchDocument(binding, document)) {
      issues.push({
        code: "search_document_mismatch",
        kind: binding.record.kind,
        message: `Localized search document drifted for canonical id "${binding.record.id}" locale "${binding.variantLocale}": expected kind "${binding.record.kind}" and url "${binding.record.routePath}" but found kind "${document.kind}" and url "${document.url}".`,
      });
    }
  }

  for (const document of localizedSearchDocuments) {
    if (expectedBindingIds.has(document.id)) {
      continue;
    }

    issues.push({
      code: "stale_search_document",
      kind: document.kind,
      message: `Localized search documents contain stale entry "${document.id}" for ${document.kind}:${document.url} with no matching validated localized variant.`,
    });
  }

  return issues;
}

function matchesArtifactEntry(
  document: LocalizedSearchDocument,
  entry: PublicSearchArtifactEntry,
): boolean {
  return (
    entry.id === document.id &&
    entry.canonicalId === document.canonicalId &&
    entry.locale === document.locale &&
    entry.canonicalLocale === document.canonicalLocale &&
    entry.kind === document.kind &&
    entry.url === document.url &&
    entry.title === document.title &&
    entry.description === document.description &&
    entry.section === document.section &&
    entry.searchPriority === document.searchPriority &&
    JSON.stringify([...entry.availableLocales]) ===
      JSON.stringify([...document.availableLocales]) &&
    JSON.stringify([...entry.headings]) ===
      JSON.stringify([...document.headings]) &&
    JSON.stringify([...entry.tags]) === JSON.stringify([...document.tags]) &&
    JSON.stringify(entry.aliases ?? []) ===
      JSON.stringify(document.aliases ?? []) &&
    entry.body === document.body
  );
}

function validateLocalizedSearchArtifact(
  localizedSearchDocuments: readonly LocalizedSearchDocument[],
  artifact: PublicSearchArtifact,
): PublicContentValidationIssue[] {
  const documentsById = buildExpectedSearchDocumentById(
    localizedSearchDocuments,
  );
  const artifactEntriesById = new Map(
    artifact.entries.map((entry) => [entry.id, entry]),
  );
  const issues: PublicContentValidationIssue[] = [];

  for (const document of localizedSearchDocuments) {
    const artifactEntry = artifactEntriesById.get(document.id);

    if (!artifactEntry) {
      issues.push({
        code: "missing_search_artifact_entry",
        kind: document.kind,
        message: `Generated localized search artifact is missing ${document.canonicalId} for locale "${document.locale}".`,
      });
      continue;
    }

    if (!matchesArtifactEntry(document, artifactEntry)) {
      issues.push({
        code: "search_artifact_entry_mismatch",
        kind: document.kind,
        message: `Generated localized search artifact drifted for canonical id "${document.canonicalId}" locale "${document.locale}": expected id "${document.id}", kind "${document.kind}", title "${document.title}", url "${document.url}" but found id "${artifactEntry.id}", kind "${artifactEntry.kind}", title "${artifactEntry.title}", url "${artifactEntry.url}".`,
      });
    }
  }

  for (const artifactEntry of artifact.entries) {
    if (documentsById.has(artifactEntry.id)) {
      continue;
    }

    issues.push({
      code: "stale_search_artifact_entry",
      kind: artifactEntry.kind,
      message: `Generated localized search artifact contains stale entry "${artifactEntry.id}" for ${artifactEntry.kind}:${artifactEntry.url} with no matching validated localized search document.`,
    });
  }

  return issues;
}

export function validatePublicContentGraph(
  graph: PublicContentValidationGraph,
  artifact: PublicSearchArtifact,
): PublicContentValidationResult {
  const coveredKinds = collectCoveredKinds(graph.canonicalRecords);
  const issues = [
    ...validateCanonicalCoverage(coveredKinds),
    ...validateCanonicalIds(graph.canonicalRecords),
    ...validateRouteIdentity(graph.canonicalRecords),
    ...validateLocalizedVariants(graph.canonicalRecords, graph.variantBindings),
    ...validateSearchDocuments(
      graph.variantBindings,
      graph.localizedSearchDocuments,
    ),
    ...validateLocalizedSearchArtifact(
      graph.localizedSearchDocuments,
      artifact,
    ),
  ];

  if (issues.length === 0) {
    return {
      ok: true,
      coveredKinds,
      issues: [],
    };
  }

  return {
    ok: false,
    coveredKinds,
    issues,
  };
}

export function formatPublicContentValidationResult(
  result: PublicContentValidationResult,
): string {
  if (result.ok) {
    return `Public content validation passed for kinds: ${result.coveredKinds.join(", ")}.`;
  }

  return result.issues.map((issue) => issue.message).join("\n");
}
