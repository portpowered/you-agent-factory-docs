import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import {
  PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
  packagedFactoriesFactoryJsonRelativePath,
} from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  buildPackagedFactoryIndexCorpus,
  buildPackagedFactoryIndexCorpusEntry,
  extractPackagedDescription,
  hashPackagedFactorySourceText,
  PackagedFactoryIndexCorpusError,
} from "./index-corpus-model";

const GOAL_FACTORY_JSON = JSON.stringify(
  {
    name: "@you/goal",
    id: "builtin-goal",
    workTypes: [{ name: "goal" }],
  },
  null,
  2,
);

function definitionForSlug(
  slug: (typeof PACKAGED_FACTORIES_ALLOWLIST_SLUGS)[number],
  overrides?: { factoryJsonText?: string; name?: string },
) {
  const name = overrides?.name ?? `@you/${slug}`;
  const factoryJsonText =
    overrides?.factoryJsonText ??
    JSON.stringify({ name, id: `builtin-${slug}` });
  return {
    childSlug: slug,
    relativePath: packagedFactoriesFactoryJsonRelativePath(slug),
    factoryJsonText,
  };
}

function allAllowlistedDefinitions(
  overrideSlug?: (typeof PACKAGED_FACTORIES_ALLOWLIST_SLUGS)[number],
  overrideText?: string,
) {
  return PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) =>
    definitionForSlug(
      slug,
      slug === overrideSlug && overrideText !== undefined
        ? { factoryJsonText: overrideText }
        : undefined,
    ),
  );
}

describe("packaged-factory index corpus model (pure)", () => {
  test("hashes factory.json UTF-8 bytes with SHA-256", () => {
    const expected = createHash("sha256")
      .update(GOAL_FACTORY_JSON, "utf8")
      .digest("hex");
    expect(hashPackagedFactorySourceText(GOAL_FACTORY_JSON)).toBe(expected);
  });

  test("extracts packaged description only from straightforward metadata", () => {
    expect(extractPackagedDescription({ name: "@you/goal" })).toBeNull();
    expect(
      extractPackagedDescription({
        name: "@you/goal",
        description: "  ",
      }),
    ).toBeNull();
    expect(
      extractPackagedDescription({
        name: "@you/goal",
        description: "Ship a named goal loop.",
      }),
    ).toBe("Ship a named goal loop.");
    expect(
      extractPackagedDescription({
        name: "@you/goal",
        description: {
          type: "LOCALIZABLE_ASSET",
          value: "Localized packaged description.",
        },
      }),
    ).toBe("Localized packaged description.");
    // Example prose must not be treated as the factory packaged description.
    expect(
      extractPackagedDescription({
        name: "@you/goal",
        examples: [
          {
            description: {
              type: "LOCALIZABLE_ASSET",
              value: "Invented from an example.",
            },
          },
        ],
      }),
    ).toBeNull();
  });

  test("builds an entry with canonical name, null description, unabridged json, version, hash", () => {
    const entry = buildPackagedFactoryIndexCorpusEntry({
      childSlug: "goal",
      factoryJsonText: GOAL_FACTORY_JSON,
      packageVersion: PACKAGED_FACTORY_V002_VERSION,
    });

    expect(entry.canonicalName).toBe("@you/goal");
    expect(entry.packagedDescription).toBeNull();
    expect(entry.childSlug).toBe("goal");
    expect(entry.sourceRelativePath).toBe("factories/goal/factory.json");
    expect(entry.factoryJsonText).toBe(GOAL_FACTORY_JSON);
    expect(entry.factoryJson).toEqual(JSON.parse(GOAL_FACTORY_JSON));
    expect(entry.packageVersion).toBe("0.0.2");
    expect(entry.factoryJsonSha256).toBe(
      hashPackagedFactorySourceText(GOAL_FACTORY_JSON),
    );
  });

  test("fails closed on wrong package version", () => {
    expect(() =>
      buildPackagedFactoryIndexCorpusEntry({
        childSlug: "goal",
        factoryJsonText: GOAL_FACTORY_JSON,
        packageVersion: "0.0.1",
      }),
    ).toThrow(PackagedFactoryIndexCorpusError);

    try {
      buildPackagedFactoryIndexCorpusEntry({
        childSlug: "goal",
        factoryJsonText: GOAL_FACTORY_JSON,
        packageVersion: "0.0.1",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryIndexCorpusError);
      expect((error as PackagedFactoryIndexCorpusError).code).toBe(
        "wrong-package-version",
      );
    }
  });

  test("fails closed on invalid factory definition JSON/shape", () => {
    expect(() =>
      buildPackagedFactoryIndexCorpusEntry({
        childSlug: "goal",
        factoryJsonText: "{not-json",
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
      }),
    ).toThrow(/did not parse as JSON/);

    expect(() =>
      buildPackagedFactoryIndexCorpusEntry({
        childSlug: "goal",
        factoryJsonText: JSON.stringify(["not", "an", "object"]),
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
      }),
    ).toThrow(/must be a JSON object/);

    expect(() =>
      buildPackagedFactoryIndexCorpusEntry({
        childSlug: "goal",
        factoryJsonText: JSON.stringify({ id: "builtin-goal" }),
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
      }),
    ).toThrow(/canonical name/);
  });

  test("builds ordered corpus for every allowlisted slug without requiring exports map", () => {
    const corpus = buildPackagedFactoryIndexCorpus({
      packageVersion: PACKAGED_FACTORY_V002_VERSION,
      exportsMapAbsent: true,
      definitions: allAllowlistedDefinitions(),
    });

    expect(corpus.formatVersion).toBe("1");
    expect(corpus.packageName).toBe("@you-agent-factory/packaged-factories");
    expect(corpus.packageVersion).toBe("0.0.2");
    expect(corpus.exportsMapAbsent).toBe(true);
    expect(corpus.entries.map((entry) => entry.childSlug)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);
    expect(corpus.entries.map((entry) => entry.canonicalName)).toEqual(
      PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) => `@you/${slug}`),
    );
    for (const entry of corpus.entries) {
      expect(entry.factoryJsonText.length).toBeGreaterThan(0);
      expect(entry.factoryJsonSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.packagedDescription).toBeNull();
    }
  });

  test("fails closed when an allowlisted definition is missing", () => {
    const definitions = allAllowlistedDefinitions().filter(
      (definition) => definition.childSlug !== "tts",
    );
    expect(() =>
      buildPackagedFactoryIndexCorpus({
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
        exportsMapAbsent: true,
        definitions,
      }),
    ).toThrow(/Missing allowlisted factory definition for slug "tts"/);
  });

  test("absence of exports map does not fail; exportsMapAbsent false is also accepted", () => {
    const withExportsPresent = buildPackagedFactoryIndexCorpus({
      packageVersion: PACKAGED_FACTORY_V002_VERSION,
      exportsMapAbsent: false,
      definitions: allAllowlistedDefinitions(),
    });
    expect(withExportsPresent.exportsMapAbsent).toBe(false);
  });
});
