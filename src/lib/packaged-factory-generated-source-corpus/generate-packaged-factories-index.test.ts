import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getProjectRoot } from "@/lib/content/content-paths";
import { PACKAGED_FACTORIES_ALLOWLIST_SLUGS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  generatePackagedFactoriesIndex,
  getPackagedFactoriesIndexGeneratedRoot,
} from "./generate-packaged-factories-index";
import {
  PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH,
  PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH,
  PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT,
  PACKAGED_FACTORIES_INDEX_MANIFEST_PATH,
  packagedFactoriesIndexFactoryDefinitionArtifactPath,
} from "./generated-artifacts-model";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir !== undefined) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("generate packaged-factories index artifacts (IO)", () => {
  test("writes deterministic artifacts under an output directory", () => {
    const outputDir = mkdtempSync(
      join(tmpdir(), "packaged-factories-index-gen-"),
    );
    tempDirs.push(outputDir);

    const first = generatePackagedFactoriesIndex({
      consumerDir: getProjectRoot(),
      outputDir,
    });

    expect(first.changedCount).toBe(first.bundle.files.length);
    expect(first.bundle.index.entries.map((entry) => entry.childSlug)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);
    expect(first.bundle.index.companionSource.childSlug).toBe("deep-research");
    expect(
      first.bundle.index.companionSource.sourceText.trim().length,
    ).toBeGreaterThan(0);

    const indexPath = join(outputDir, PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH);
    const manifestPath = join(
      outputDir,
      PACKAGED_FACTORIES_INDEX_MANIFEST_PATH,
    );
    const companionPath = join(
      outputDir,
      PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH,
    );

    const indexJson = JSON.parse(readFileSync(indexPath, "utf8")) as {
      packageVersion: string;
      entries: Array<{ childSlug: string; factoryJsonText: string }>;
      companionSource: { sourceText: string; sourceSha256: string };
    };
    expect(indexJson.packageVersion).toBe("0.0.2");
    expect(indexJson.entries.map((entry) => entry.childSlug)).toEqual([
      ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
    ]);
    expect(indexJson.companionSource.sourceText).toBe(
      first.bundle.index.companionSource.sourceText,
    );

    const manifestJson = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      packageVersion: string;
      generatedRelativeRoot: string;
      artifacts: Array<{ path: string; sourceSha256?: string }>;
      sourceHashes: Array<{ relativePath: string; sha256: string }>;
    };
    expect(manifestJson.packageVersion).toBe("0.0.2");
    expect(manifestJson.generatedRelativeRoot).toBe(
      PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT,
    );
    expect(manifestJson.sourceHashes.length).toBe(
      PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length + 1,
    );
    expect(manifestJson.artifacts.some((a) => a.path === "index.json")).toBe(
      true,
    );

    for (const slug of PACKAGED_FACTORIES_ALLOWLIST_SLUGS) {
      const relativePath =
        packagedFactoriesIndexFactoryDefinitionArtifactPath(slug);
      const onDisk = readFileSync(join(outputDir, relativePath), "utf8");
      const entry = first.bundle.index.entries.find(
        (item) => item.childSlug === slug,
      );
      expect(entry).toBeDefined();
      if (entry === undefined) {
        throw new Error(`missing corpus entry for ${slug}`);
      }
      expect(onDisk).toBe(entry.factoryJsonText);
    }

    const companionOnDisk = readFileSync(companionPath, "utf8");
    expect(JSON.parse(companionOnDisk)).toEqual(
      first.bundle.index.companionSource,
    );

    const second = generatePackagedFactoriesIndex({
      consumerDir: getProjectRoot(),
      outputDir,
    });
    expect(second.changedCount).toBe(0);
    expect(second.bundle.files).toEqual(first.bundle.files);
    const expectedIndexContents = first.bundle.files.find(
      (file) => file.relativePath === PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH,
    )?.contents;
    expect(expectedIndexContents).toBeDefined();
    if (expectedIndexContents === undefined) {
      throw new Error("missing generated index.json contents in first bundle");
    }
    expect(readFileSync(indexPath, "utf8")).toBe(expectedIndexContents);
  });

  test("default output root resolves under packaged-factories-index/generated", () => {
    const root = getPackagedFactoriesIndexGeneratedRoot(getProjectRoot());
    expect(
      root.endsWith(PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT),
    ).toBe(true);
  });
});
