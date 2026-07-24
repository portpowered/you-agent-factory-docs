/**
 * Build-only acquisition of the packaged-factories@0.0.2 ordered index corpus.
 *
 * Resolves the installed package root via the existing docs-owned allowlisted
 * filesystem pull, then builds the pure index corpus model. Absence of a
 * package exports map or order export must not fail acquisition.
 */

import { getProjectRoot } from "@/lib/content/content-paths";
import {
  PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
  type PackagedFactoriesAllowlistSlug,
  packagedFactoriesFactoryJsonRelativePath,
} from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import {
  type PackagedFactoriesFilesystemPullDependencies,
  type PackagedFactoriesFilesystemPullResult,
  pullPackagedFactoriesAllowlistedFiles,
} from "@/lib/packaged-factory-v002/packaged-factories-filesystem-pull";
import {
  type AcquiredFactoryDefinitionInput,
  buildPackagedFactoryIndexCorpus,
  type PackagedFactoryIndexCorpus,
  PackagedFactoryIndexCorpusError,
} from "./index-corpus-model";

export type AcquirePackagedFactoryIndexCorpusDependencies =
  PackagedFactoriesFilesystemPullDependencies & {
    pullAllowlistedFiles?: (
      consumerDir: string,
      dependencies?: PackagedFactoriesFilesystemPullDependencies,
    ) => PackagedFactoriesFilesystemPullResult;
  };

export type AcquirePackagedFactoryIndexCorpusOptions = {
  /**
   * Directory used to resolve `@you-agent-factory/packaged-factories/package.json`.
   * Defaults to the docs project root (host install).
   */
  consumerDir?: string;
} & AcquirePackagedFactoryIndexCorpusDependencies;

export type AcquirePackagedFactoryIndexCorpusResult = {
  corpus: PackagedFactoryIndexCorpus;
  packageRoot: string;
  pull: PackagedFactoriesFilesystemPullResult;
};

function slugForRequiredFactoryJsonPath(
  relativePath: string,
): PackagedFactoriesAllowlistSlug {
  for (const slug of PACKAGED_FACTORIES_ALLOWLIST_SLUGS) {
    if (relativePath === packagedFactoriesFactoryJsonRelativePath(slug)) {
      return slug;
    }
  }
  throw new PackagedFactoryIndexCorpusError(
    "slug-order-mismatch",
    `Pulled required path "${relativePath}" is not a docs-owned allowlisted factory.json path.`,
    { relativePath },
  );
}

/**
 * Map a filesystem pull result into acquired definition inputs for the pure
 * corpus builder. Companion JavaScript is ignored here (owned by later stories).
 */
export function acquiredDefinitionsFromPackagedFactoriesPull(
  pull: PackagedFactoriesFilesystemPullResult,
): AcquiredFactoryDefinitionInput[] {
  return pull.required.map((file) => ({
    childSlug: slugForRequiredFactoryJsonPath(file.relativePath),
    relativePath: file.relativePath,
    factoryJsonText: file.text,
  }));
}

/**
 * Acquire every allowlisted factory.json from installed packaged-factories@0.0.2
 * and build the ordered index corpus model (canonical name, packaged description,
 * child slug, unabridged factory.json, package version, SHA-256 hash).
 *
 * Fail closed via the underlying filesystem pull (missing files, wrong version,
 * path escape) and via the pure corpus builder (invalid definitions / order).
 * Absence of an exports map does not fail.
 */
export function acquirePackagedFactoryIndexCorpus(
  options: AcquirePackagedFactoryIndexCorpusOptions = {},
): AcquirePackagedFactoryIndexCorpusResult {
  const {
    consumerDir = getProjectRoot(),
    pullAllowlistedFiles = pullPackagedFactoriesAllowlistedFiles,
    ...pullDependencies
  } = options;

  const pull = pullAllowlistedFiles(consumerDir, pullDependencies);
  const definitions = acquiredDefinitionsFromPackagedFactoriesPull(pull);
  const corpus = buildPackagedFactoryIndexCorpus({
    packageVersion: pull.installedVersion,
    exportsMapAbsent: pull.exportsMapAbsent,
    definitions,
  });

  return {
    corpus,
    packageRoot: pull.packageRoot,
    pull,
  };
}
