import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import {
  buildDeepResearchCompanionSource,
  DEEP_RESEARCH_CHILD_SLUG,
  DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
  PACKAGED_FACTORY_COMPANION_SOURCE_KIND,
  PackagedFactoryCompanionSourceError,
} from "./companion-source-model";
import { hashPackagedFactorySourceText } from "./index-corpus-model";

const SAMPLE_COMPANION_JS = `return (async function () {
  phase("lead-research");
  return { ok: true };
})();
`;

describe("packaged-factory companion source model (pure)", () => {
  test("preserves complete raw UTF-8 text with straightforward metadata and SHA-256", () => {
    const companion = buildDeepResearchCompanionSource({
      sourceText: SAMPLE_COMPANION_JS,
      relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
      canonicalName: "@you/deep-research",
      packageVersion: PACKAGED_FACTORY_V002_VERSION,
    });

    expect(companion.formatVersion).toBe("1");
    expect(companion.sourceKind).toBe(PACKAGED_FACTORY_COMPANION_SOURCE_KIND);
    expect(companion.sourceKind).toBe("companion-javascript");
    expect(companion.childSlug).toBe(DEEP_RESEARCH_CHILD_SLUG);
    expect(companion.canonicalName).toBe("@you/deep-research");
    expect(companion.packageVersion).toBe("0.0.2");
    expect(companion.relativePath).toBe(
      "factories/deep-research/scripts/deep-research.workflow.js",
    );
    expect(companion.sourceText).toBe(SAMPLE_COMPANION_JS);
    expect(companion.sourceSha256).toBe(
      hashPackagedFactorySourceText(SAMPLE_COMPANION_JS),
    );
    expect(companion.sourceSha256).toBe(
      createHash("sha256").update(SAMPLE_COMPANION_JS, "utf8").digest("hex"),
    );
  });

  test("does not derive stage/worker/call-graph fields from companion JavaScript", () => {
    const companion = buildDeepResearchCompanionSource({
      sourceText: SAMPLE_COMPANION_JS,
      relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
      canonicalName: "@you/deep-research",
      packageVersion: PACKAGED_FACTORY_V002_VERSION,
    });

    const keys = Object.keys(companion).sort();
    expect(keys).toEqual(
      [
        "canonicalName",
        "childSlug",
        "formatVersion",
        "packageVersion",
        "relativePath",
        "sourceKind",
        "sourceSha256",
        "sourceText",
      ].sort(),
    );
    expect(companion).not.toHaveProperty("stages");
    expect(companion).not.toHaveProperty("workers");
    expect(companion).not.toHaveProperty("callGraph");
    expect(companion).not.toHaveProperty("summary");
    expect(companion).not.toHaveProperty("ast");
    // Raw text is preserved verbatim — including phase("lead-research") —
    // without being interpreted into structured stage metadata.
    expect(companion.sourceText).toContain('phase("lead-research")');
  });

  test("fails closed on wrong package version", () => {
    expect(() =>
      buildDeepResearchCompanionSource({
        sourceText: SAMPLE_COMPANION_JS,
        relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
        canonicalName: "@you/deep-research",
        packageVersion: "0.0.1",
      }),
    ).toThrow(PackagedFactoryCompanionSourceError);

    try {
      buildDeepResearchCompanionSource({
        sourceText: SAMPLE_COMPANION_JS,
        relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
        canonicalName: "@you/deep-research",
        packageVersion: "0.0.1",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryCompanionSourceError);
      expect((error as PackagedFactoryCompanionSourceError).code).toBe(
        "wrong-package-version",
      );
    }
  });

  test("fails closed on empty companion text — never invents substitute source", () => {
    expect(() =>
      buildDeepResearchCompanionSource({
        sourceText: "   ",
        relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
        canonicalName: "@you/deep-research",
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
      }),
    ).toThrow(/refusing to invent substitute source/);

    try {
      buildDeepResearchCompanionSource({
        sourceText: "",
        relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
        canonicalName: "@you/deep-research",
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PackagedFactoryCompanionSourceError);
      expect((error as PackagedFactoryCompanionSourceError).code).toBe(
        "empty-companion-source",
      );
    }
  });

  test("fails closed on companion path mismatch", () => {
    expect(() =>
      buildDeepResearchCompanionSource({
        sourceText: SAMPLE_COMPANION_JS,
        relativePath: "factories/deep-research/other.js",
        canonicalName: "@you/deep-research",
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
      }),
    ).toThrow(/does not match required allowlisted path/);
  });

  test("fails closed on missing canonical name metadata", () => {
    expect(() =>
      buildDeepResearchCompanionSource({
        sourceText: SAMPLE_COMPANION_JS,
        relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
        canonicalName: "  ",
        packageVersion: PACKAGED_FACTORY_V002_VERSION,
      }),
    ).toThrow(/canonical name/);
  });
});
