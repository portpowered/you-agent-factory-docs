import { describe, expect, test } from "bun:test";
import {
  type LocalizedContentVariantBinding,
  validateExplicitStarterLocaleMetadata,
  validateLocaleRegistryMetadata,
  validateLocalizedVariantBindings,
} from "../../src/lib/content";
import type { CanonicalContentRecord } from "../../src/lib/content/types";

function createDocRecord(
  overrides: Partial<CanonicalContentRecord> = {},
): CanonicalContentRecord {
  return {
    id: "doc/getting-started",
    kind: "doc",
    slug: "getting-started",
    routePath: "/docs/getting-started",
    section: "guides",
    tags: ["intro"],
    status: "published",
    canonicalLocale: "en",
    availableLocales: ["en"],
    searchInclude: true,
    navigationTitle: "Getting started",
    ...overrides,
  };
}

function createBinding(
  overrides: Partial<LocalizedContentVariantBinding> = {},
  recordOverrides: Partial<CanonicalContentRecord> = {},
): LocalizedContentVariantBinding {
  return {
    contentPathKey: "doc/getting-started",
    variantLocale: "en",
    record: createDocRecord(recordOverrides),
    ...overrides,
  };
}

describe("starter locale metadata validation", () => {
  test("requires explicit canonicalLocale, availableLocales, and id in frontmatter", () => {
    const errors = validateExplicitStarterLocaleMetadata(
      {
        title: "Getting started",
        status: "published",
      },
      {
        contentDirectory: "docs",
        slug: "getting-started",
        locale: "en",
        source: "",
      },
    );

    expect(errors.map((error) => error.field).sort()).toEqual([
      "availableLocales",
      "canonicalLocale",
      "id",
    ]);
    expect(errors.every((error) => error.message.includes("explicitly"))).toBe(
      true,
    );
  });

  test("rejects locale metadata that drifts from the supported locale registry", () => {
    const errors = validateLocaleRegistryMetadata({
      canonicalLocale: "en-US",
      availableLocales: ["en-US", "de"],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "canonicalLocale",
          message: expect.stringContaining("not a supported locale"),
        }),
        expect.objectContaining({
          field: "availableLocales",
          message: expect.stringContaining('unsupported locale "de"'),
        }),
      ]),
    );
  });

  test("rejects localized groups missing the canonical-locale variant file", () => {
    const result = validateLocalizedVariantBindings([
      createBinding(
        { variantLocale: "fr" },
        {
          canonicalLocale: "en",
          availableLocales: ["en", "fr"],
          navigationTitle: "Commencer",
        },
      ),
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected missing canonical-locale variant failure");
    }

    expect(result.errors).toEqual([
      expect.objectContaining({
        field: "doc/getting-started.canonicalLocale",
        message: expect.stringContaining(
          'missing canonical-locale variant "en"',
        ),
      }),
      expect.objectContaining({
        field: "doc/getting-started.availableLocales",
        message: expect.stringContaining(
          'missing localized variant file for locale "en"',
        ),
      }),
    ]);
  });

  test("rejects availableLocales entries without matching localized variant files", () => {
    const result = validateLocalizedVariantBindings([
      createBinding(
        { variantLocale: "en" },
        {
          canonicalLocale: "en",
          availableLocales: ["en", "fr"],
        },
      ),
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected missing localized variant failure");
    }

    expect(result.errors).toEqual([
      expect.objectContaining({
        field: "doc/getting-started.availableLocales",
        message: expect.stringContaining(
          'missing localized variant file for locale "fr"',
        ),
      }),
    ]);
  });
});
