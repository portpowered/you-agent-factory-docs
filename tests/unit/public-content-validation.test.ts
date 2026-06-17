import { describe, expect, test } from "bun:test";
import {
  SUPPORTED_PUBLIC_CONTENT_KINDS,
  getPublicContentGraph,
} from "../../src/lib/content/public-content";
import {
  formatPublicContentValidationResult,
  validatePublicContentGraph,
} from "../../src/lib/content/public-content-validation";

describe("public content validation", () => {
  test("covers every supported public content kind in one validation contract", () => {
    const result = validatePublicContentGraph(getPublicContentGraph());

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
});
