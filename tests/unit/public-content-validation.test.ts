import { describe, expect, test } from "bun:test";
import {
  SUPPORTED_PUBLIC_CONTENT_KINDS,
  getPublicContentGraph,
  getPublicLocalizedSearchArtifact,
} from "../../src/lib/content/public-content";
import {
  formatPublicContentValidationResult,
  validatePublicContentGraph,
} from "../../src/lib/content/public-content-validation";
import {
  DEFAULT_MAKE_CHECK_STAGES,
  runMakeCheck,
} from "../../src/lib/quality/make-check";

describe("public content validation", () => {
  test("make check runs content validation before typecheck and lint", () => {
    expect(DEFAULT_MAKE_CHECK_STAGES.map((stage) => stage.id)).toEqual([
      "content_validation",
      "typecheck",
      "lint",
    ]);
  });

  test("make check reports content-validation failures as distinct from lint and typecheck failures", async () => {
    const messages = {
      stdout: [] as string[],
      stderr: [] as string[],
    };
    const invokedStages: string[] = [];
    const exitCode = await runMakeCheck({
      runner: async (stage) => {
        invokedStages.push(stage.id);
        if (stage.id === "content_validation") {
          return {
            exitCode: 1,
            stdout: "",
            stderr:
              'Canonical id "docs.quickstart" is duplicated between docs:quickstart and reference:quickstart-api.',
          };
        }

        return {
          exitCode: 0,
          stdout: "",
          stderr: "",
        };
      },
      stdout: (message) => messages.stdout.push(message),
      stderr: (message) => messages.stderr.push(message),
    });

    expect(exitCode).toBe(1);
    expect(invokedStages).toEqual(["content_validation"]);
    expect(messages.stdout).toEqual([
      "[make check] Running content validation to validate the public content graph and generated search artifact...",
    ]);
    expect(messages.stderr).toEqual([
      'Canonical id "docs.quickstart" is duplicated between docs:quickstart and reference:quickstart-api.',
      "[make check] content validation failed.\nContent validation blocked this change for a content-graph or generated-artifact reason.\nCommand: bun run validate:content",
    ]);
  });

  test("covers every supported public content kind in one validation contract", () => {
    const result = validatePublicContentGraph(
      getPublicContentGraph(),
      getPublicLocalizedSearchArtifact(),
    );

    expect(result.ok).toBe(true);
    expect(result.coveredKinds).toEqual([...SUPPORTED_PUBLIC_CONTENT_KINDS]);
  });

  test("fails clearly when one supported kind is missing from the graph", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph({
      canonicalRecords: graph.canonicalRecords.filter(
        (entry) => entry.kind !== "reference",
      ),
      localizedVariants: graph.localizedVariants.filter(
        (entry) => entry.kind !== "reference",
      ),
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        code: "missing_kind_coverage",
        kind: "reference",
        message: "Public content validation is missing reference coverage.",
      },
    ]);
    expect(formatPublicContentValidationResult(result)).toContain(
      "missing reference coverage",
    );
  });

  test("fails clearly when canonical ids collide across supported public content", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph({
      ...graph,
      canonicalRecords: [
        ...graph.canonicalRecords,
        {
          canonicalId: "docs.quickstart",
          kind: "reference",
          canonicalLocale: "en",
          slug: "quickstart-api",
          title: "Quickstart API",
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "duplicate_canonical_id",
      kind: "reference",
      message:
        'Canonical id "docs.quickstart" is duplicated between docs:quickstart and reference:quickstart-api.',
    });
  });

  test("fails clearly when localized variants break canonical relationships", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph({
      ...graph,
      localizedVariants: [
        ...graph.localizedVariants.filter(
          (variant) =>
            !(
              variant.canonicalId === "docs.quickstart" &&
              variant.locale === "en"
            ) && variant.canonicalId !== "blog.agent-review-loops",
        ),
        {
          canonicalId: "missing.reference-id",
          kind: "reference",
          locale: "en",
          slug: "missing-reference",
          title: "Missing Reference",
        },
        {
          canonicalId: "glossary.canonical-record",
          kind: "comparison",
          locale: "en",
          slug: "glossary-as-comparison",
          title: "Glossary As Comparison",
        },
        {
          canonicalId: "comparison.openai-vs-anthropic",
          kind: "comparison",
          locale: "en",
          slug: "openai-vs-anthropic-duplicate",
          title: "OpenAI vs Anthropic Duplicate",
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          code: "missing_canonical_record",
          kind: "reference",
          message:
            'Localized variant reference:missing-reference (en) points to missing canonical id "missing.reference-id".',
        },
        {
          code: "mismatched_variant_kind",
          kind: "comparison",
          message:
            'Localized variant comparison:glossary-as-comparison (en) points to canonical id "glossary.canonical-record" owned by glossary.',
        },
        {
          code: "duplicate_variant_locale",
          kind: "comparison",
          message:
            'Canonical id "comparison.openai-vs-anthropic" has multiple localized variants for locale "en": comparison:openai-vs-anthropic and comparison:openai-vs-anthropic-duplicate.',
        },
        {
          code: "missing_canonical_locale_variant",
          kind: "docs",
          message:
            'Canonical id "docs.quickstart" is missing its canonical locale variant "en".',
        },
        {
          code: "missing_canonical_locale_variant",
          kind: "blog",
          message:
            'Canonical id "blog.agent-review-loops" is missing its canonical locale variant "en".',
        },
      ]),
    );
    expect(formatPublicContentValidationResult(result)).toContain(
      'missing canonical id "missing.reference-id"',
    );
  });

  test("fails clearly when canonical records collide on a public route identity", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph({
      ...graph,
      canonicalRecords: [
        ...graph.canonicalRecords,
        {
          canonicalId: "docs.quickstart-alternate",
          kind: "docs",
          canonicalLocale: "en",
          slug: "quickstart",
          title: "Alternate Quickstart",
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "duplicate_canonical_slug",
      kind: "docs",
      message:
        'Public identity "docs/quickstart" is claimed by canonical ids "docs.quickstart" and "docs.quickstart-alternate".',
    });
  });

  test("fails clearly when localized variants collide on the same locale-specific public identity", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph({
      ...graph,
      canonicalRecords: [
        ...graph.canonicalRecords,
        {
          canonicalId: "docs.installation",
          kind: "docs",
          canonicalLocale: "en",
          slug: "installation",
          title: "Installation",
        },
      ],
      localizedVariants: [
        ...graph.localizedVariants,
        {
          canonicalId: "docs.installation",
          kind: "docs",
          locale: "en",
          slug: "installation",
          title: "Installation",
        },
        {
          canonicalId: "docs.installation",
          kind: "docs",
          locale: "fr",
          slug: "demarrage-rapide",
          title: "Installation",
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "duplicate_variant_slug",
      kind: "docs",
      message:
        'Localized public identity "docs/demarrage-rapide" for locale "fr" is claimed by canonical ids "docs.quickstart" and "docs.installation".',
    });
  });

  test("fails clearly when a canonical-locale route drifts from its canonical record", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph({
      ...graph,
      localizedVariants: graph.localizedVariants.map((variant) =>
        variant.canonicalId === "blog.agent-review-loops" &&
        variant.locale === "en"
          ? {
              ...variant,
              slug: "agent-review-loops-updated",
            }
          : variant,
      ),
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "canonical_locale_slug_mismatch",
      kind: "blog",
      message:
        'Canonical id "blog.agent-review-loops" has route drift between canonical slug "agent-review-loops" and canonical-locale variant slug "agent-review-loops-updated" (en).',
    });
    expect(formatPublicContentValidationResult(result)).toContain(
      'Canonical id "blog.agent-review-loops" has route drift',
    );
  });

  test("fails clearly when the generated localized search artifact omits a validated entry", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph(
      graph,
      getPublicLocalizedSearchArtifact().filter(
        (entry) =>
          !(
            entry.canonicalId === "comparison.openai-vs-anthropic" &&
            entry.locale === "en"
          ),
      ),
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "missing_search_artifact_entry",
      kind: "comparison",
      message:
        'Generated localized search artifact is missing comparison:openai-vs-anthropic for locale "en" (canonical id "comparison.openai-vs-anthropic").',
    });
    expect(formatPublicContentValidationResult(result)).toContain(
      "Generated localized search artifact is missing comparison:openai-vs-anthropic",
    );
  });

  test("fails clearly when the generated localized search artifact contains a stale entry", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph(graph, [
      ...getPublicLocalizedSearchArtifact(),
      {
        id: "reference.retired-api:en",
        canonicalId: "reference.retired-api",
        locale: "en",
        kind: "reference",
        url: "/en/reference/retired-api",
        title: "Retired API",
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "stale_search_artifact_entry",
      kind: "reference",
      message:
        'Generated localized search artifact contains stale entry "reference.retired-api:en" for reference:/en/reference/retired-api with no matching validated localized variant.',
    });
  });

  test("fails clearly when the generated localized search artifact drifts from validated variant metadata", () => {
    const graph = getPublicContentGraph();
    const result = validatePublicContentGraph(
      graph,
      getPublicLocalizedSearchArtifact().map((entry) =>
        entry.canonicalId === "docs.quickstart" && entry.locale === "fr"
          ? {
              ...entry,
              title: "Guide de demarrage",
              url: "/fr/docs/demarrage",
            }
          : entry,
      ),
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      code: "search_artifact_entry_mismatch",
      kind: "docs",
      message:
        'Generated localized search artifact drifted for canonical id "docs.quickstart" locale "fr": expected id "docs.quickstart:fr", kind "docs", title "Demarrage rapide", url "/fr/docs/demarrage-rapide" but found id "docs.quickstart:fr", kind "docs", title "Guide de demarrage", url "/fr/docs/demarrage".',
    });
    expect(formatPublicContentValidationResult(result)).toContain(
      'Generated localized search artifact drifted for canonical id "docs.quickstart" locale "fr"',
    );
  });
});
