import { describe, expect, test } from "bun:test";
import {
  type ContentMetadataInput,
  validateContentMetadata,
} from "../../src/lib/content";

function validMetadata(
  overrides: Partial<ContentMetadataInput> = {},
): ContentMetadataInput {
  return {
    id: "doc/getting-started",
    kind: "doc",
    slug: "getting-started",
    canonicalLocale: "en",
    availableLocales: ["en"],
    status: "published",
    tags: ["docs"],
    navigationTitle: "Getting started",
    section: "guides",
    order: 1,
    search: {
      include: true,
      priority: 10,
    },
    ...overrides,
  };
}

describe("validateContentMetadata", () => {
  test("accepts valid metadata and projects a canonical content record", () => {
    const result = validateContentMetadata(validMetadata());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected validation success");
    }

    expect(result.record).toEqual({
      id: "doc/getting-started",
      kind: "doc",
      slug: "getting-started",
      routePath: "/docs/getting-started",
      section: "guides",
      tags: ["docs"],
      status: "published",
      order: 1,
      canonicalLocale: "en",
      availableLocales: ["en"],
      searchInclude: true,
      searchPriority: 10,
      navigationTitle: "Getting started",
    });
  });

  test("supports all public content kinds with kind-specific route paths", () => {
    const cases = [
      { kind: "doc", slug: "install", routePath: "/docs/install" },
      { kind: "blog", slug: "launch", routePath: "/blog/launch" },
      { kind: "glossary", slug: "agent", routePath: "/glossary/agent" },
      {
        kind: "comparison",
        slug: "vs-n8n",
        routePath: "/comparisons/vs-n8n",
      },
      {
        kind: "reference",
        slug: "loop-engineering",
        routePath: "/references/loop-engineering",
      },
    ] as const;

    for (const { kind, slug, routePath } of cases) {
      const result = validateContentMetadata(
        validMetadata({
          id: `${kind}/${slug}`,
          kind,
          slug,
        }),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error(`expected ${kind} validation success`);
      }

      expect(result.record.kind).toBe(kind);
      expect(result.record.routePath).toBe(routePath);
      expect(result.record.availableLocales).toEqual(["en"]);
    }
  });

  test("rejects missing canonical identity fields with clear errors", () => {
    const result = validateContentMetadata({
      id: "",
      kind: "",
      slug: "",
      canonicalLocale: "",
      availableLocales: [],
      status: "",
      tags: "docs" as unknown as string[],
      navigationTitle: "",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }

    const fields = result.errors.map((error) => error.field);
    expect(fields).toContain("id");
    expect(fields).toContain("kind");
    expect(fields).toContain("slug");
    expect(fields).toContain("canonicalLocale");
    expect(fields).toContain("availableLocales");
    expect(fields).toContain("status");
    expect(fields).toContain("tags");
    expect(fields).toContain("navigationTitle");
  });

  test("rejects conflicting canonical identity between id, kind, and slug", () => {
    const result = validateContentMetadata(
      validMetadata({
        id: "blog/getting-started",
        kind: "doc",
        slug: "getting-started",
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }

    expect(result.errors.some((error) => error.field === "id")).toBe(true);
    expect(
      result.errors.some((error) =>
        error.message.includes('does not match kind "doc"'),
      ),
    ).toBe(true);
  });

  test("rejects unsupported content kinds", () => {
    const result = validateContentMetadata(
      validMetadata({
        id: "landing/home",
        kind: "landing",
        slug: "home",
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected validation failure");
    }

    expect(result.errors).toEqual([
      expect.objectContaining({
        field: "kind",
        message: expect.stringContaining(
          "doc, blog, glossary, comparison, reference",
        ),
      }),
    ]);
  });

  test("rejects invalid locale declarations and canonical locale mismatches", () => {
    const invalidLocaleResult = validateContentMetadata(
      validMetadata({
        canonicalLocale: "english",
        availableLocales: ["english"],
      }),
    );

    expect(invalidLocaleResult.ok).toBe(false);
    if (invalidLocaleResult.ok) {
      throw new Error("expected invalid locale failure");
    }

    expect(
      invalidLocaleResult.errors.some(
        (error) => error.field === "canonicalLocale",
      ),
    ).toBe(true);
    expect(
      invalidLocaleResult.errors.some(
        (error) => error.field === "availableLocales",
      ),
    ).toBe(true);

    const mismatchResult = validateContentMetadata(
      validMetadata({
        canonicalLocale: "en",
        availableLocales: ["fr"],
      }),
    );

    expect(mismatchResult.ok).toBe(false);
    if (mismatchResult.ok) {
      throw new Error("expected canonical locale mismatch failure");
    }

    expect(
      mismatchResult.errors.some(
        (error) =>
          error.field === "canonicalLocale" &&
          error.message.includes("must be included in availableLocales"),
      ),
    ).toBe(true);
  });

  test("rejects invalid publication and search visibility metadata", () => {
    const statusResult = validateContentMetadata(
      validMetadata({ status: "archived" }),
    );

    expect(statusResult.ok).toBe(false);
    if (statusResult.ok) {
      throw new Error("expected invalid status failure");
    }

    expect(statusResult.errors).toEqual([
      expect.objectContaining({
        field: "status",
        message: expect.stringContaining("published, draft, internal, hidden"),
      }),
    ]);

    const searchResult = validateContentMetadata(
      validMetadata({
        search: {
          include: "yes" as unknown as boolean,
          priority: -1,
        },
      }),
    );

    expect(searchResult.ok).toBe(false);
    if (searchResult.ok) {
      throw new Error("expected invalid search metadata failure");
    }

    expect(
      searchResult.errors.some((error) => error.field === "search.include"),
    ).toBe(true);
    expect(
      searchResult.errors.some((error) => error.field === "search.priority"),
    ).toBe(true);
  });

  test("preserves canonical identity and locale metadata for future localized variants", () => {
    const result = validateContentMetadata(
      validMetadata({
        canonicalLocale: "en",
        availableLocales: ["en", "en-US"],
        navigationTitle: "Getting started",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected validation success");
    }

    expect(result.record.id).toBe("doc/getting-started");
    expect(result.record.kind).toBe("doc");
    expect(result.record.slug).toBe("getting-started");
    expect(result.record.routePath).toBe("/docs/getting-started");
    expect(result.record.canonicalLocale).toBe("en");
    expect(result.record.availableLocales).toEqual(["en", "en-US"]);
  });

  test("rejects duplicate locale tags in availableLocales", () => {
    const result = validateContentMetadata(
      validMetadata({
        availableLocales: ["en", "en"],
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected duplicate locale failure");
    }

    expect(result.errors).toEqual([
      expect.objectContaining({
        field: "availableLocales",
        message: expect.stringContaining("duplicate locale tags"),
      }),
    ]);
  });

  test("defaults search inclusion to true when search metadata is omitted", () => {
    const result = validateContentMetadata(
      validMetadata({
        search: undefined,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected validation success");
    }

    expect(result.record.searchInclude).toBe(true);
    expect(result.record.searchPriority).toBeUndefined();
  });
});
