import {
  type PublicContentCanonicalRecord,
  type PublicContentGraph,
  type PublicContentKind,
  type PublicContentLocalizedVariant,
  type PublicLocalizedSearchDocument,
  SUPPORTED_PUBLIC_CONTENT_KINDS,
  getPublicContentVariantUrl,
} from "@/lib/content/public-content";

export type PublicContentValidationIssue = {
  code:
    | "missing_kind_coverage"
    | "duplicate_canonical_id"
    | "duplicate_canonical_slug"
    | "missing_canonical_record"
    | "mismatched_variant_kind"
    | "duplicate_variant_locale"
    | "missing_canonical_locale_variant"
    | "duplicate_variant_slug"
    | "canonical_locale_slug_mismatch"
    | "missing_search_artifact_entry"
    | "stale_search_artifact_entry"
    | "search_artifact_entry_mismatch";
  kind: PublicContentKind;
  message: string;
};

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
  canonicalRecords: PublicContentCanonicalRecord[],
): PublicContentKind[] {
  const coveredKinds = new Set(canonicalRecords.map((entry) => entry.kind));

  return SUPPORTED_PUBLIC_CONTENT_KINDS.filter((kind) =>
    coveredKinds.has(kind),
  );
}

function validateCanonicalCoverage(
  canonicalRecords: PublicContentCanonicalRecord[],
  coveredKinds: PublicContentKind[],
): PublicContentValidationIssue[] {
  return SUPPORTED_PUBLIC_CONTENT_KINDS.flatMap((kind) => {
    if (coveredKinds.includes(kind)) {
      return [];
    }

    return [
      {
        code: "missing_kind_coverage" as const,
        kind,
        message: `Public content validation is missing ${kind} coverage.`,
      },
    ];
  });
}

function validateCanonicalIds(
  canonicalRecords: PublicContentCanonicalRecord[],
): PublicContentValidationIssue[] {
  const seenCanonicalIds = new Map<string, PublicContentCanonicalRecord>();
  const issues: PublicContentValidationIssue[] = [];

  for (const record of canonicalRecords) {
    const existingRecord = seenCanonicalIds.get(record.canonicalId);

    if (!existingRecord) {
      seenCanonicalIds.set(record.canonicalId, record);
      continue;
    }

    issues.push({
      code: "duplicate_canonical_id",
      kind: record.kind,
      message: `Canonical id "${record.canonicalId}" is duplicated between ${existingRecord.kind}:${existingRecord.slug} and ${record.kind}:${record.slug}.`,
    });
  }

  return issues;
}

function validateRouteIdentity(
  canonicalRecords: PublicContentCanonicalRecord[],
  localizedVariants: PublicContentLocalizedVariant[],
): PublicContentValidationIssue[] {
  const seenCanonicalSlugs = new Map<string, PublicContentCanonicalRecord>();
  const seenLocalizedSlugs = new Map<string, PublicContentLocalizedVariant>();
  const canonicalRecordsById = new Map(
    canonicalRecords.map((record) => [record.canonicalId, record]),
  );
  const issues: PublicContentValidationIssue[] = [];

  for (const record of canonicalRecords) {
    const canonicalSlugKey = `${record.kind}:${record.slug}`;
    const existingRecord = seenCanonicalSlugs.get(canonicalSlugKey);

    if (existingRecord) {
      issues.push({
        code: "duplicate_canonical_slug",
        kind: record.kind,
        message: `Public identity "${record.kind}/${record.slug}" is claimed by canonical ids "${existingRecord.canonicalId}" and "${record.canonicalId}".`,
      });
      continue;
    }

    seenCanonicalSlugs.set(canonicalSlugKey, record);
  }

  for (const variant of localizedVariants) {
    const canonicalRecord = canonicalRecordsById.get(variant.canonicalId);

    if (!canonicalRecord) {
      continue;
    }

    const localizedSlugKey = `${variant.kind}:${variant.locale}:${variant.slug}`;
    const existingVariant = seenLocalizedSlugs.get(localizedSlugKey);

    if (existingVariant) {
      issues.push({
        code: "duplicate_variant_slug",
        kind: variant.kind,
        message: `Localized public identity "${variant.kind}/${variant.slug}" for locale "${variant.locale}" is claimed by canonical ids "${existingVariant.canonicalId}" and "${variant.canonicalId}".`,
      });
      continue;
    }

    seenLocalizedSlugs.set(localizedSlugKey, variant);

    if (
      variant.locale === canonicalRecord.canonicalLocale &&
      variant.slug !== canonicalRecord.slug
    ) {
      issues.push({
        code: "canonical_locale_slug_mismatch",
        kind: variant.kind,
        message: `Canonical id "${variant.canonicalId}" has route drift between canonical slug "${canonicalRecord.slug}" and canonical-locale variant slug "${variant.slug}" (${variant.locale}).`,
      });
    }
  }

  return issues;
}

function validateLocalizedVariants(
  canonicalRecords: PublicContentCanonicalRecord[],
  localizedVariants: PublicContentLocalizedVariant[],
): PublicContentValidationIssue[] {
  const canonicalRecordsById = new Map(
    canonicalRecords.map((record) => [record.canonicalId, record]),
  );
  const seenVariantLocales = new Map<string, PublicContentLocalizedVariant>();
  const canonicalLocalesWithVariants = new Set<string>();
  const issues: PublicContentValidationIssue[] = [];

  for (const variant of localizedVariants) {
    const canonicalRecord = canonicalRecordsById.get(variant.canonicalId);

    if (!canonicalRecord) {
      issues.push({
        code: "missing_canonical_record",
        kind: variant.kind,
        message: `Localized variant ${variant.kind}:${variant.slug} (${variant.locale}) points to missing canonical id "${variant.canonicalId}".`,
      });
      continue;
    }

    if (canonicalRecord.kind !== variant.kind) {
      issues.push({
        code: "mismatched_variant_kind",
        kind: variant.kind,
        message: `Localized variant ${variant.kind}:${variant.slug} (${variant.locale}) points to canonical id "${variant.canonicalId}" owned by ${canonicalRecord.kind}.`,
      });
    }

    const variantLocaleKey = `${variant.canonicalId}:${variant.locale}`;
    const existingVariant = seenVariantLocales.get(variantLocaleKey);

    if (existingVariant) {
      issues.push({
        code: "duplicate_variant_locale",
        kind: variant.kind,
        message: `Canonical id "${variant.canonicalId}" has multiple localized variants for locale "${variant.locale}": ${existingVariant.kind}:${existingVariant.slug} and ${variant.kind}:${variant.slug}.`,
      });
      continue;
    }

    seenVariantLocales.set(variantLocaleKey, variant);

    if (variant.locale === canonicalRecord.canonicalLocale) {
      canonicalLocalesWithVariants.add(canonicalRecord.canonicalId);
    }
  }

  for (const record of canonicalRecords) {
    if (canonicalLocalesWithVariants.has(record.canonicalId)) {
      continue;
    }

    issues.push({
      code: "missing_canonical_locale_variant",
      kind: record.kind,
      message: `Canonical id "${record.canonicalId}" is missing its canonical locale variant "${record.canonicalLocale}".`,
    });
  }

  return issues;
}

function validateLocalizedSearchArtifact(
  graph: PublicContentGraph,
  localizedSearchArtifact: PublicLocalizedSearchDocument[],
): PublicContentValidationIssue[] {
  const canonicalRecordsById = new Map(
    graph.canonicalRecords.map((record) => [record.canonicalId, record]),
  );
  const localizedVariantsByKey = new Map(
    graph.localizedVariants.map((variant) => [
      `${variant.canonicalId}:${variant.locale}`,
      variant,
    ]),
  );
  const issues: PublicContentValidationIssue[] = [];

  for (const variant of graph.localizedVariants) {
    const artifactKey = `${variant.canonicalId}:${variant.locale}`;
    const artifactEntry = localizedSearchArtifact.find(
      (entry) => `${entry.canonicalId}:${entry.locale}` === artifactKey,
    );

    if (!artifactEntry) {
      issues.push({
        code: "missing_search_artifact_entry",
        kind: variant.kind,
        message: `Generated localized search artifact is missing ${variant.kind}:${variant.slug} for locale "${variant.locale}" (canonical id "${variant.canonicalId}").`,
      });
      continue;
    }

    const expectedUrl = getPublicContentVariantUrl(variant);

    if (
      artifactEntry.id !== artifactKey ||
      artifactEntry.kind !== variant.kind ||
      artifactEntry.title !== variant.title ||
      artifactEntry.url !== expectedUrl
    ) {
      issues.push({
        code: "search_artifact_entry_mismatch",
        kind: variant.kind,
        message: `Generated localized search artifact drifted for canonical id "${variant.canonicalId}" locale "${variant.locale}": expected id "${artifactKey}", kind "${variant.kind}", title "${variant.title}", url "${expectedUrl}" but found id "${artifactEntry.id}", kind "${artifactEntry.kind}", title "${artifactEntry.title}", url "${artifactEntry.url}".`,
      });
    }
  }

  for (const artifactEntry of localizedSearchArtifact) {
    const variantKey = `${artifactEntry.canonicalId}:${artifactEntry.locale}`;
    const matchingVariant = localizedVariantsByKey.get(variantKey);

    if (matchingVariant) {
      continue;
    }

    const canonicalRecord = canonicalRecordsById.get(artifactEntry.canonicalId);
    issues.push({
      code: "stale_search_artifact_entry",
      kind: canonicalRecord?.kind ?? artifactEntry.kind,
      message: `Generated localized search artifact contains stale entry "${artifactEntry.id}" for ${artifactEntry.kind}:${artifactEntry.url} with no matching validated localized variant.`,
    });
  }

  return issues;
}

export function validatePublicContentGraph(
  graph: PublicContentGraph,
  localizedSearchArtifact?: PublicLocalizedSearchDocument[],
): PublicContentValidationResult {
  const coveredKinds = collectCoveredKinds(graph.canonicalRecords);
  const artifactToValidate =
    localizedSearchArtifact === undefined
      ? graph.localizedVariants.map((variant) => ({
          id: `${variant.canonicalId}:${variant.locale}`,
          canonicalId: variant.canonicalId,
          locale: variant.locale,
          kind: variant.kind,
          url: getPublicContentVariantUrl(variant),
          title: variant.title,
        }))
      : localizedSearchArtifact;
  const issues = [
    ...validateCanonicalCoverage(graph.canonicalRecords, coveredKinds),
    ...validateCanonicalIds(graph.canonicalRecords),
    ...validateRouteIdentity(graph.canonicalRecords, graph.localizedVariants),
    ...validateLocalizedVariants(
      graph.canonicalRecords,
      graph.localizedVariants,
    ),
    ...validateLocalizedSearchArtifact(graph, artifactToValidate),
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
