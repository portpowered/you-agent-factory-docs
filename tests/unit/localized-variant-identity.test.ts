import { describe, expect, test } from "bun:test";
import {
  type CanonicalContentRecord,
  type LocalizedContentVariantBinding,
  projectLocalizedVariantGroups,
  projectLocalizedVariantIdentity,
  validateLocalizedVariantBindings,
} from "../../src/lib/content";

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

describe("localized content variant identity", () => {
  test("projects reviewer-verifiable identity fields from a canonical record", () => {
    const record = createDocRecord({
      canonicalLocale: "en",
      availableLocales: ["en", "fr"],
    });

    expect(projectLocalizedVariantIdentity(record, "fr")).toEqual({
      canonicalPageId: "doc/getting-started",
      canonicalLocale: "en",
      variantLocale: "fr",
      availableLocales: ["en", "fr"],
    });
  });

  test("groups parallel locale variants under one canonical page identity", () => {
    const groups = projectLocalizedVariantGroups([
      createBinding(
        { variantLocale: "en" },
        {
          canonicalLocale: "en",
          availableLocales: ["en", "fr"],
        },
      ),
      createBinding(
        { variantLocale: "fr" },
        {
          canonicalLocale: "en",
          availableLocales: ["en", "fr"],
          navigationTitle: "Commencer",
        },
      ),
    ]);

    expect(groups).toEqual([
      {
        canonicalPageId: "doc/getting-started",
        canonicalLocale: "en",
        availableLocales: ["en", "fr"],
        variants: [
          {
            canonicalPageId: "doc/getting-started",
            canonicalLocale: "en",
            variantLocale: "en",
            availableLocales: ["en", "fr"],
          },
          {
            canonicalPageId: "doc/getting-started",
            canonicalLocale: "en",
            variantLocale: "fr",
            availableLocales: ["en", "fr"],
          },
        ],
      },
    ]);
  });

  test("rejects conflicting canonical page ids across localized variants", () => {
    const result = validateLocalizedVariantBindings([
      createBinding({ variantLocale: "en" }),
      createBinding({ variantLocale: "fr" }, { id: "doc/getting-started-fr" }),
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected conflicting canonical page id failure");
    }

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "doc/getting-started.canonicalPageId",
          message: expect.stringContaining("conflicting canonical page ids"),
        }),
      ]),
    );
  });

  test("rejects duplicate variant locales for one canonical page", () => {
    const result = validateLocalizedVariantBindings([
      createBinding({ variantLocale: "en" }),
      createBinding(
        { variantLocale: "en" },
        { navigationTitle: "Duplicate English variant" },
      ),
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected duplicate variant locale failure");
    }

    expect(result.errors).toEqual([
      expect.objectContaining({
        field: "doc/getting-started.variants.en.variantLocale",
        message: expect.stringContaining('duplicate variant locale "en"'),
      }),
    ]);
  });

  test("rejects unsupported locale declarations from the locale registry", () => {
    const result = validateLocalizedVariantBindings([
      createBinding(
        { variantLocale: "de" },
        {
          canonicalLocale: "de",
          availableLocales: ["de"],
        },
      ),
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected unsupported locale failure");
    }

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "doc/getting-started.variants.de.variantLocale",
          message: expect.stringContaining('unsupported variant locale "de"'),
        }),
        expect.objectContaining({
          field: "doc/getting-started.availableLocales",
          message: expect.stringContaining(
            'unsupported locale declaration "de"',
          ),
        }),
      ]),
    );
  });

  test("rejects conflicting canonical locale and availableLocales across variants", () => {
    const canonicalLocaleResult = validateLocalizedVariantBindings([
      createBinding(
        { variantLocale: "en" },
        { canonicalLocale: "en", availableLocales: ["en", "fr"] },
      ),
      createBinding(
        { variantLocale: "fr" },
        { canonicalLocale: "fr", availableLocales: ["en", "fr"] },
      ),
    ]);

    expect(canonicalLocaleResult.ok).toBe(false);
    if (canonicalLocaleResult.ok) {
      throw new Error("expected conflicting canonical locale failure");
    }

    expect(canonicalLocaleResult.errors).toEqual([
      expect.objectContaining({
        field: "doc/getting-started.canonicalLocale",
        message: expect.stringContaining("conflicting canonical locale"),
      }),
    ]);

    const availableLocalesResult = validateLocalizedVariantBindings([
      createBinding(
        { variantLocale: "en" },
        { availableLocales: ["en", "fr"] },
      ),
      createBinding({ variantLocale: "fr" }, { availableLocales: ["en"] }),
    ]);

    expect(availableLocalesResult.ok).toBe(false);
    if (availableLocalesResult.ok) {
      throw new Error("expected conflicting availableLocales failure");
    }

    expect(availableLocalesResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "doc/getting-started.availableLocales",
          message: expect.stringContaining("conflicting availableLocales"),
        }),
      ]),
    );
  });

  test("accepts aligned localized variants and returns grouped identity output", () => {
    const result = validateLocalizedVariantBindings([
      createBinding(
        { variantLocale: "en" },
        {
          canonicalLocale: "en",
          availableLocales: ["en", "fr"],
        },
      ),
      createBinding(
        { variantLocale: "fr" },
        {
          canonicalLocale: "en",
          availableLocales: ["en", "fr"],
          navigationTitle: "Commencer",
        },
      ),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected localized variant validation success");
    }

    expect(result.groups).toEqual([
      {
        canonicalPageId: "doc/getting-started",
        canonicalLocale: "en",
        availableLocales: ["en", "fr"],
        variants: [
          expect.objectContaining({ variantLocale: "en" }),
          expect.objectContaining({ variantLocale: "fr" }),
        ],
      },
    ]);
  });
});
