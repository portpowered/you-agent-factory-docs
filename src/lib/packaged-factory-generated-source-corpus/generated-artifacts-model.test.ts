import { describe, expect, test } from "bun:test";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  buildDeepResearchCompanionSource,
  DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
} from "./companion-source-model";
import {
  buildPackagedFactoriesIndexGeneratedBundle,
  buildPackagedFactoriesIndexGeneratedIndex,
  PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH,
  PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH,
  PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT,
  PACKAGED_FACTORIES_INDEX_MANIFEST_PATH,
  PackagedFactoriesIndexGeneratedArtifactsError,
  packagedFactoriesIndexFactoryDefinitionArtifactPath,
  serializePackagedFactoriesIndexGeneratedJson,
} from "./generated-artifacts-model";
import {
  buildPackagedFactoryIndexCorpus,
  hashPackagedFactorySourceText,
  type PackagedFactoryIndexCorpus,
} from "./index-corpus-model";

function sampleFactoryJson(name: string): string {
  return `${JSON.stringify({ name, version: "1.0.0" }, null, 2)}\n`;
}

function sampleCorpus(): PackagedFactoryIndexCorpus {
  return buildPackagedFactoryIndexCorpus({
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
    exportsMapAbsent: true,
    definitions: PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) => ({
      childSlug: slug,
      relativePath: `factories/${slug}/factory.json`,
      factoryJsonText: sampleFactoryJson(`@you/${slug}`),
    })),
  });
}

function sampleCompanion(corpus: PackagedFactoryIndexCorpus) {
  const deepResearch = corpus.entries.find(
    (entry) => entry.childSlug === "deep-research",
  );
  if (deepResearch === undefined) {
    throw new Error("expected deep-research entry in sample corpus");
  }
  return buildDeepResearchCompanionSource({
    sourceText: `return (async function () { return { ok: true }; })();\n`,
    relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
    canonicalName: deepResearch.canonicalName,
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
  });
}

describe("packaged-factories index generated artifacts (pure)", () => {
  test("builds ordered index with corpus + companion fields", () => {
    const corpus = sampleCorpus();
    const companion = sampleCompanion(corpus);
    const index = buildPackagedFactoriesIndexGeneratedIndex(corpus, companion);

    expect(index.packageVersion).toBe("0.0.2");
    expect(index.exportsMapAbsent).toBe(true);
    expect(index.entries.map((entry) => entry.childSlug)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);
    expect(index.companionSource.sourceText).toBe(companion.sourceText);
    expect(index.companionSource.sourceSha256).toBe(companion.sourceSha256);
    expect(index.companionSource.relativePath).toBe(
      DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
    );

    for (const entry of index.entries) {
      expect(entry.factoryJsonText).toBe(
        sampleFactoryJson(entry.canonicalName),
      );
      expect(entry.factoryJson).toEqual(JSON.parse(entry.factoryJsonText));
      expect(entry.factoryJsonSha256).toBe(
        hashPackagedFactorySourceText(entry.factoryJsonText),
      );
      expect(entry.packagedDescription).toBeNull();
    }
  });

  test("emits deterministic artifact paths including definitions, companion, and manifest", () => {
    const corpus = sampleCorpus();
    const companion = sampleCompanion(corpus);
    const bundle = buildPackagedFactoriesIndexGeneratedBundle(
      corpus,
      companion,
    );

    expect(bundle.files.map((file) => file.relativePath)).toEqual([
      PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH,
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) =>
        packagedFactoriesIndexFactoryDefinitionArtifactPath(slug),
      ),
      PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH,
      PACKAGED_FACTORIES_INDEX_MANIFEST_PATH,
    ]);

    const goalDefinition = bundle.files.find(
      (file) => file.relativePath === "factories/goal.factory.json",
    );
    expect(goalDefinition?.contents).toBe(sampleFactoryJson("@you/goal"));

    const companionFile = bundle.files.find(
      (file) =>
        file.relativePath === PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH,
    );
    expect(companionFile?.contents).toBe(
      serializePackagedFactoriesIndexGeneratedJson(companion),
    );

    expect(bundle.manifest.packageVersion).toBe("0.0.2");
    expect(bundle.manifest.generatedRelativeRoot).toBe(
      PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT,
    );
    expect(bundle.manifest.sourceHashes).toEqual([
      ...corpus.entries.map((entry) => ({
        relativePath: entry.sourceRelativePath,
        sha256: entry.factoryJsonSha256,
      })),
      {
        relativePath: companion.relativePath,
        sha256: companion.sourceSha256,
      },
    ]);
    expect(bundle.manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "index.json",
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map(
        (slug) => `factories/${slug}.factory.json`,
      ),
      "deep-research.source.json",
    ]);
  });

  test("rebuilding the same inputs yields byte-identical file contents", () => {
    const corpus = sampleCorpus();
    const companion = sampleCompanion(corpus);
    const first = buildPackagedFactoriesIndexGeneratedBundle(corpus, companion);
    const second = buildPackagedFactoriesIndexGeneratedBundle(
      corpus,
      companion,
    );

    expect(second.files).toEqual(first.files);
    expect(second.manifest).toEqual(first.manifest);
  });

  test("fails closed when companion canonical name diverges from corpus", () => {
    const corpus = sampleCorpus();
    const companion = buildDeepResearchCompanionSource({
      sourceText: `return (async function () { return { ok: true }; })();\n`,
      relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
      canonicalName: "@you/not-deep-research",
      packageVersion: PACKAGED_FACTORY_V002_VERSION,
    });

    expect(() =>
      buildPackagedFactoriesIndexGeneratedIndex(corpus, companion),
    ).toThrow(PackagedFactoriesIndexGeneratedArtifactsError);

    try {
      buildPackagedFactoriesIndexGeneratedIndex(corpus, companion);
    } catch (error) {
      expect(error).toBeInstanceOf(
        PackagedFactoriesIndexGeneratedArtifactsError,
      );
      if (error instanceof PackagedFactoriesIndexGeneratedArtifactsError) {
        expect(error.code).toBe("corpus-companion-mismatch");
      }
    }
  });
});
