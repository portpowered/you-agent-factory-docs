import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadPublicSearchArtifact } from "../../src/lib/content/load-search-artifact";
import { loadLocalizedSearchDocuments } from "../../src/lib/content/load-search-documents";
import { loadStarterContentRecords } from "../../src/lib/content/load-starter-content";
import {
  formatPublicContentValidationResult,
  projectCanonicalRecordsForValidation,
  validatePublicContentGraph,
} from "../../src/lib/content/public-content-validation";
import { assertStarterContentValid } from "../../src/lib/content/starter-content-errors";
import type { CanonicalContentRecord } from "../../src/lib/content/types";
import { PUBLIC_CONTENT_KINDS } from "../../src/lib/content/types";
import { runValidationScript } from "../helpers/validation";

const CONTENT_ROOT = join(process.cwd(), "src/content");
function cloneRecord(record: CanonicalContentRecord): CanonicalContentRecord {
  return {
    ...record,
    availableLocales: [...record.availableLocales],
    tags: [...record.tags],
  };
}

function expectPresent<T>(value: T | undefined, label: string): T {
  expect(value).toBeDefined();
  if (value === undefined) {
    throw new Error(`Expected ${label} to be present`);
  }

  return value;
}

function loadBaselineValidationInputs() {
  const { failures, variantBindings } = loadStarterContentRecords(CONTENT_ROOT);
  assertStarterContentValid(failures);

  const bindings = variantBindings.map((binding) => ({
    ...binding,
    record: cloneRecord(binding.record),
  }));
  const canonicalRecords =
    projectCanonicalRecordsForValidation(bindings).map(cloneRecord);
  const localizedSearchDocuments = loadLocalizedSearchDocuments(
    CONTENT_ROOT,
  ).map((document) => ({
    ...document,
    availableLocales: [...document.availableLocales],
    headings: [...document.headings],
    tags: [...document.tags],
    ...(document.aliases ? { aliases: [...document.aliases] } : {}),
  }));
  const artifact = {
    ...loadPublicSearchArtifact({ contentRoot: CONTENT_ROOT }),
    entries: loadPublicSearchArtifact({
      contentRoot: CONTENT_ROOT,
    }).entries.map((entry) => ({
      ...entry,
      availableLocales: [...entry.availableLocales],
      headings: [...entry.headings],
      tags: [...entry.tags],
      ...(entry.aliases ? { aliases: [...entry.aliases] } : {}),
    })),
  };

  return {
    canonicalRecords,
    variantBindings: bindings,
    localizedSearchDocuments,
    artifact,
  };
}

describe("public content validation", () => {
  test("validate:content succeeds when the default generated search artifact is absent", () => {
    const missingArtifactPath = join(
      mkdtempSync(join(tmpdir(), "missing-public-search-artifact-")),
      "public-search-index.json",
    );
    const result = runValidationScript("validate:content", undefined, {
      env: {
        PUBLIC_SEARCH_ARTIFACT_DEFAULT_PATH: missingArtifactPath,
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Content validation passed");
  });

  test("validate:content reports checked-in public-search artifact drift as a content-validation failure", () => {
    const result = runValidationScript(
      "validate:content",
      "broken-public-content",
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Public content validation failed");
    expect(result.stderr).toContain(
      'Generated localized search artifact is missing doc/getting-started for locale "fr".',
    );
  });

  test("covers every supported public content kind in one validation contract", () => {
    const baseline = loadBaselineValidationInputs();
    const result = validatePublicContentGraph(
      {
        canonicalRecords: baseline.canonicalRecords,
        variantBindings: baseline.variantBindings,
        localizedSearchDocuments: baseline.localizedSearchDocuments,
      },
      baseline.artifact,
    );

    expect(result.ok).toBe(true);
    expect(result.coveredKinds).toEqual([...PUBLIC_CONTENT_KINDS]);
  });

  test("fails clearly when one supported kind is missing from the graph", () => {
    const baseline = loadBaselineValidationInputs();
    const result = validatePublicContentGraph(
      {
        canonicalRecords: baseline.canonicalRecords.filter(
          (record) => record.kind !== "reference",
        ),
        variantBindings: baseline.variantBindings.filter(
          (binding) => binding.record.kind !== "reference",
        ),
        localizedSearchDocuments: baseline.localizedSearchDocuments.filter(
          (document) => document.kind !== "reference",
        ),
      },
      {
        ...baseline.artifact,
        entries: baseline.artifact.entries.filter(
          (entry) => entry.kind !== "reference",
        ),
      },
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        code: "missing_kind_coverage",
        kind: "reference",
        message: "Public content validation is missing reference coverage.",
      },
    ]);
  });

  test("fails clearly when canonical ids collide across supported public content", () => {
    const baseline = loadBaselineValidationInputs();
    const docRecord = expectPresent(
      baseline.canonicalRecords.find(
        (record) => record.id === "doc/getting-started",
      ),
      "doc/getting-started canonical record",
    );
    const result = validatePublicContentGraph(
      {
        canonicalRecords: [
          ...baseline.canonicalRecords,
          {
            ...cloneRecord(docRecord),
            id: "doc/getting-started",
            kind: "reference",
            slug: "getting-started-api",
            routePath: "/references/getting-started-api",
            navigationTitle: "Getting started API",
            section: "references",
            tags: ["reference"],
          },
        ],
        variantBindings: baseline.variantBindings,
        localizedSearchDocuments: baseline.localizedSearchDocuments,
      },
      baseline.artifact,
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "duplicate_canonical_id",
      kind: "reference",
      message:
        'Canonical id "doc/getting-started" is duplicated between doc:getting-started and reference:getting-started-api.',
    });
  });

  test("fails clearly when localized variants break canonical relationships", () => {
    const baseline = loadBaselineValidationInputs();
    const comparisonBinding = expectPresent(
      baseline.variantBindings.find(
        (binding) =>
          binding.record.id === "comparison/vs-n8n" &&
          binding.variantLocale === "en",
      ),
      "comparison/vs-n8n en binding",
    );
    const glossaryBinding = expectPresent(
      baseline.variantBindings.find(
        (binding) =>
          binding.record.id === "glossary/agent" &&
          binding.variantLocale === "en",
      ),
      "glossary/agent en binding",
    );
    const referenceBinding = expectPresent(
      baseline.variantBindings.find(
        (binding) =>
          binding.record.id === "reference/loop-engineering" &&
          binding.variantLocale === "en",
      ),
      "reference/loop-engineering en binding",
    );

    const result = validatePublicContentGraph(
      {
        canonicalRecords: baseline.canonicalRecords,
        variantBindings: [
          ...baseline.variantBindings.filter(
            (binding) =>
              !(
                binding.record.id === "doc/getting-started" &&
                binding.variantLocale === "en"
              ) &&
              !(
                binding.record.id === "blog/introducing-factory" &&
                binding.variantLocale === "en"
              ),
          ),
          {
            ...referenceBinding,
            contentPathKey: "reference/missing-reference",
            record: {
              ...cloneRecord(referenceBinding.record),
              id: "reference/missing-reference",
              slug: "missing-reference",
              routePath: "/references/missing-reference",
              navigationTitle: "Missing reference",
            },
          },
          {
            ...glossaryBinding,
            contentPathKey: "comparison/glossary-as-comparison",
            record: {
              ...cloneRecord(glossaryBinding.record),
              kind: "comparison",
            },
          },
          {
            ...comparisonBinding,
            contentPathKey: "comparison/vs-n8n-duplicate",
          },
        ],
        localizedSearchDocuments: baseline.localizedSearchDocuments,
      },
      baseline.artifact,
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          code: "missing_canonical_record",
          kind: "reference",
          message:
            'Localized variant reference/missing-reference (en) points to missing canonical id "reference/missing-reference".',
        },
        {
          code: "mismatched_variant_kind",
          kind: "comparison",
          message:
            'Localized variant comparison/glossary-as-comparison (en) points to canonical id "glossary/agent" owned by glossary.',
        },
        {
          code: "duplicate_variant_locale",
          kind: "comparison",
          message:
            'Canonical id "comparison/vs-n8n" has multiple localized variants for locale "en": comparison/vs-n8n and comparison/vs-n8n-duplicate.',
        },
        {
          code: "missing_canonical_locale_variant",
          kind: "doc",
          message:
            'Canonical id "doc/getting-started" is missing its canonical locale variant "en".',
        },
        {
          code: "missing_canonical_locale_variant",
          kind: "blog",
          message:
            'Canonical id "blog/introducing-factory" is missing its canonical locale variant "en".',
        },
      ]),
    );
    expect(formatPublicContentValidationResult(result)).toContain(
      'missing canonical id "reference/missing-reference"',
    );
  });

  test("fails clearly when canonical records collide on a public route identity", () => {
    const baseline = loadBaselineValidationInputs();
    const docRecord = expectPresent(
      baseline.canonicalRecords.find(
        (record) => record.id === "doc/getting-started",
      ),
      "doc/getting-started canonical record",
    );
    const result = validatePublicContentGraph(
      {
        canonicalRecords: [
          ...baseline.canonicalRecords,
          {
            ...cloneRecord(docRecord),
            id: "doc/getting-started-alternate",
            slug: "getting-started-alternate",
            routePath: "/docs/getting-started",
            navigationTitle: "Getting started alternate",
          },
        ],
        variantBindings: baseline.variantBindings,
        localizedSearchDocuments: baseline.localizedSearchDocuments,
      },
      baseline.artifact,
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "duplicate_route_path",
      kind: "doc",
      message:
        'Public route "/docs/getting-started" is claimed by canonical ids "doc/getting-started" and "doc/getting-started-alternate".',
    });
  });

  test("fails clearly when the generated localized search artifact omits a validated entry", () => {
    const baseline = loadBaselineValidationInputs();
    const result = validatePublicContentGraph(
      {
        canonicalRecords: baseline.canonicalRecords,
        variantBindings: baseline.variantBindings,
        localizedSearchDocuments: baseline.localizedSearchDocuments,
      },
      {
        ...baseline.artifact,
        entries: baseline.artifact.entries.filter(
          (entry) => entry.id !== "doc/getting-started@fr",
        ),
      },
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "missing_search_artifact_entry",
      kind: "doc",
      message:
        'Generated localized search artifact is missing doc/getting-started for locale "fr".',
    });
  });

  test("fails clearly when the generated localized search artifact contains stale entries", () => {
    const baseline = loadBaselineValidationInputs();
    const result = validatePublicContentGraph(
      {
        canonicalRecords: baseline.canonicalRecords,
        variantBindings: baseline.variantBindings,
        localizedSearchDocuments: baseline.localizedSearchDocuments,
      },
      {
        ...baseline.artifact,
        entries: [
          ...baseline.artifact.entries,
          {
            ...expectPresent(
              baseline.artifact.entries[0],
              "first public search artifact entry",
            ),
            id: "reference/stale-entry@en",
            canonicalId: "reference/stale-entry",
            kind: "reference",
            url: "/references/stale-entry",
            title: "Stale entry",
          },
        ],
      },
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "stale_search_artifact_entry",
      kind: "reference",
      message:
        'Generated localized search artifact contains stale entry "reference/stale-entry@en" for reference:/references/stale-entry with no matching validated localized search document.',
    });
  });

  test("fails clearly when the generated localized search artifact drifts from localized search documents", () => {
    const baseline = loadBaselineValidationInputs();
    const result = validatePublicContentGraph(
      {
        canonicalRecords: baseline.canonicalRecords,
        variantBindings: baseline.variantBindings,
        localizedSearchDocuments: baseline.localizedSearchDocuments,
      },
      {
        ...baseline.artifact,
        entries: baseline.artifact.entries.map((entry) =>
          entry.id === "doc/getting-started@fr"
            ? {
                ...entry,
                title: "Commencer maintenant",
                url: "/docs/commencer",
              }
            : entry,
        ),
      },
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "search_artifact_entry_mismatch",
      kind: "doc",
      message:
        'Generated localized search artifact drifted for canonical id "doc/getting-started" locale "fr": expected id "doc/getting-started@fr", kind "doc", title "Commencer", url "/docs/getting-started" but found id "doc/getting-started@fr", kind "doc", title "Commencer maintenant", url "/docs/commencer".',
    });
    expect(formatPublicContentValidationResult(result)).toContain(
      'canonical id "doc/getting-started" locale "fr"',
    );
  });
});
