/**
 * Build-only generator that writes deterministic packaged-factories-index
 * artifacts under
 * `src/content/docs/references/packaged-factories-index/generated/`.
 *
 * Acquires the ordered index corpus + deep-research companion via the
 * filesystem pull, builds pure artifact contents, and writes them with
 * write-if-changed semantics so re-runs are byte-stable.
 */

import { join } from "node:path";
import { getProjectRoot } from "@/lib/content/content-paths";
import {
  type WriteFileIfChangedResult,
  writeFileIfChangedSync,
} from "@/lib/content/write-file-if-changed";
import type { PackagedFactoriesFilesystemPullDependencies } from "@/lib/packaged-factory-v002/packaged-factories-filesystem-pull";
import { buildDeepResearchCompanionSourceFromPull } from "./acquire-companion-source";
import {
  type AcquirePackagedFactoryIndexCorpusOptions,
  acquirePackagedFactoryIndexCorpus,
} from "./acquire-index-corpus";
import {
  buildPackagedFactoriesIndexGeneratedBundle,
  PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT,
  type PackagedFactoriesIndexGeneratedBundle,
} from "./generated-artifacts-model";

export type GeneratePackagedFactoriesIndexDependencies =
  PackagedFactoriesFilesystemPullDependencies & {
    pullAllowlistedFiles?: AcquirePackagedFactoryIndexCorpusOptions["pullAllowlistedFiles"];
    writeFile?: (path: string, contents: string) => WriteFileIfChangedResult;
  };

export type GeneratePackagedFactoriesIndexOptions = {
  /**
   * Absolute directory that receives generated artifacts.
   * Defaults to the docs-owned packaged-factories-index generated tree.
   */
  outputDir?: string;
  /** Docs project root used for default output path resolution. */
  projectRoot?: string;
  /**
   * Directory used to resolve `@you-agent-factory/packaged-factories/package.json`.
   * Defaults to the docs project root (host install).
   */
  consumerDir?: string;
} & GeneratePackagedFactoriesIndexDependencies;

export type GeneratePackagedFactoriesIndexResult = {
  outputDir: string;
  bundle: PackagedFactoriesIndexGeneratedBundle;
  written: WriteFileIfChangedResult[];
  changedCount: number;
};

/**
 * Absolute path of the packaged-factories-index generated artifact root.
 */
export function getPackagedFactoriesIndexGeneratedRoot(
  projectRoot = getProjectRoot(),
): string {
  return join(projectRoot, PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT);
}

/**
 * Acquire packaged-factories@0.0.2 corpus + companion and write deterministic
 * generated artifacts (index.json, per-factory definitions, companion source,
 * six factory-recording/v1 samples, manifest.json). Re-running with identical
 * package inputs leaves file bytes unchanged. Recording samples are validated
 * through the public client parser and factory-replay projections before write.
 */
export function generatePackagedFactoriesIndex(
  options: GeneratePackagedFactoriesIndexOptions = {},
): GeneratePackagedFactoriesIndexResult {
  const {
    projectRoot = getProjectRoot(),
    outputDir = getPackagedFactoriesIndexGeneratedRoot(projectRoot),
    consumerDir = projectRoot,
    writeFile = writeFileIfChangedSync,
    pullAllowlistedFiles,
    ...pullDependencies
  } = options;

  const acquired = acquirePackagedFactoryIndexCorpus({
    consumerDir,
    pullAllowlistedFiles,
    ...pullDependencies,
  });
  const companion = buildDeepResearchCompanionSourceFromPull(acquired.pull);
  const bundle = buildPackagedFactoriesIndexGeneratedBundle(
    acquired.corpus,
    companion,
  );

  const written: WriteFileIfChangedResult[] = [];
  for (const file of bundle.files) {
    written.push(writeFile(join(outputDir, file.relativePath), file.contents));
  }

  return {
    outputDir,
    bundle,
    written,
    changedCount: written.filter((entry) => entry.changed).length,
  };
}
