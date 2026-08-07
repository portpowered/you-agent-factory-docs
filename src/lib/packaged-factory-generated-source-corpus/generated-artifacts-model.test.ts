import { describe, expect, test } from "bun:test";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  buildPackagedFactoriesIndexGeneratedBundle,
  buildPackagedFactoriesIndexGeneratedIndex,
  PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH,
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
import {
  PACKAGED_FACTORY_RECORDING_SLUGS,
  packagedFactoryRecordingArtifactPath,
} from "./recording-samples-model";

function sampleFactoryJson(name: string): string {
  return `${JSON.stringify({ name, version: "1.0.0" }, null, 2)}\n`;
}

function sampleCorpus(): PackagedFactoryIndexCorpus {
  return buildPackagedFactoryIndexCorpus({
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
    exportsMapAbsent: true,
    definitions: PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) => ({
      childSlug: slug,
      relativePath: `generated/factories/${slug}/factory.json`,
      factoryJsonText: sampleFactoryJson(`@you/${slug}`),
    })),
  });
}

describe("packaged-factories index generated artifacts (pure)", () => {
  test("builds ordered index from corpus entries", () => {
    const corpus = sampleCorpus();
    const index = buildPackagedFactoriesIndexGeneratedIndex(corpus);

    expect(index.packageVersion).toBe(PACKAGED_FACTORY_V002_VERSION);
    expect(index.exportsMapAbsent).toBe(true);
    expect(index.entries.map((entry) => entry.childSlug)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);

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

  test("emits deterministic artifact paths including definitions and manifest", () => {
    const corpus = sampleCorpus();
    const bundle = buildPackagedFactoriesIndexGeneratedBundle(corpus);

    expect(bundle.files.map((file) => file.relativePath)).toEqual([
      PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH,
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) =>
        packagedFactoriesIndexFactoryDefinitionArtifactPath(slug),
      ),
          ...PACKAGED_FACTORY_RECORDING_SLUGS.map((slug) =>
        packagedFactoryRecordingArtifactPath(slug),
      ),
      PACKAGED_FACTORIES_INDEX_MANIFEST_PATH,
    ]);
    expect(bundle.recordings.map((recording) => recording.childSlug)).toEqual([
      ...PACKAGED_FACTORY_RECORDING_SLUGS,
    ]);

    const goalDefinition = bundle.files.find(
      (file) => file.relativePath === "factories/goal.factory.json",
    );
    expect(goalDefinition?.contents).toBe(sampleFactoryJson("@you/goal"));

    expect(bundle.manifest.packageVersion).toBe(PACKAGED_FACTORY_V002_VERSION);
    expect(bundle.manifest.generatedRelativeRoot).toBe(
      PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT,
    );
    expect(bundle.manifest.sourceHashes).toEqual(
      corpus.entries.map((entry) => ({
        relativePath: entry.sourceRelativePath,
        sha256: entry.factoryJsonSha256,
      })),
    );
    expect(bundle.manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "index.json",
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map(
        (slug) => `factories/${slug}.factory.json`,
      ),
      ...PACKAGED_FACTORY_RECORDING_SLUGS.map(
        (slug) => `${slug}.factory-recording.v1.json`,
      ),
    ]);
    expect(
      bundle.manifest.artifacts.filter(
        (artifact) => artifact.kind === "factory-recording",
      ),
    ).toHaveLength(PACKAGED_FACTORY_RECORDING_SLUGS.length);
  });

  test("rebuilding the same inputs yields byte-identical file contents", () => {
    const corpus = sampleCorpus();
    const first = buildPackagedFactoriesIndexGeneratedBundle(corpus);
    const second = buildPackagedFactoriesIndexGeneratedBundle(corpus);

    expect(second.files).toEqual(first.files);
    expect(second.manifest).toEqual(first.manifest);
  });

  test("fails closed when corpus entries drift from allowlist order", () => {
    // The companion-mismatch guard retired with the companion artifact itself;
    // slug order is the remaining fail-closed path on this builder. Reordering a
    // built corpus reaches it — `buildPackagedFactoryIndexCorpus` rejects
    // incomplete input before the index builder ever sees it.
    const corpus = sampleCorpus();
    const reordered: PackagedFactoryIndexCorpus = {
      ...corpus,
      entries: [...corpus.entries].reverse(),
    };

    expect(() => buildPackagedFactoriesIndexGeneratedIndex(reordered)).toThrow(
      PackagedFactoriesIndexGeneratedArtifactsError,
    );

    try {
      buildPackagedFactoriesIndexGeneratedIndex(reordered);
    } catch (error) {
      expect(error).toBeInstanceOf(
        PackagedFactoriesIndexGeneratedArtifactsError,
      );
      if (error instanceof PackagedFactoriesIndexGeneratedArtifactsError) {
        expect(error.code).toBe("slug-order-mismatch");
      }
    }
  });
});
