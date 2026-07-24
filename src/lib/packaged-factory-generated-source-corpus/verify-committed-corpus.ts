/**
 * Build-only IO: verify committed packaged-factories-index generated artifacts
 * still match live regeneration from installed packaged-factories@0.0.2, and
 * that manifest source hashes still match acquired package file bytes.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getProjectRoot } from "@/lib/content/content-paths";
import type { PackagedFactoriesFilesystemPullDependencies } from "@/lib/packaged-factory-v002/packaged-factories-filesystem-pull";
import { buildDeepResearchCompanionSourceFromPull } from "./acquire-companion-source";
import {
  type AcquirePackagedFactoryIndexCorpusOptions,
  acquirePackagedFactoryIndexCorpus,
} from "./acquire-index-corpus";
import {
  assertPackagedFactoryGeneratedArtifactsMatch,
  assertPackagedFactorySourceHashesMatch,
  type PackagedFactoryCorpusArtifactContents,
  type PackagedFactoryCorpusSourceHash,
} from "./corpus-drift";
import { getPackagedFactoriesIndexGeneratedRoot } from "./generate-packaged-factories-index";
import { buildPackagedFactoriesIndexGeneratedBundle } from "./generated-artifacts-model";
import { hashPackagedFactorySourceText } from "./index-corpus-model";

export type VerifyCommittedPackagedFactoriesIndexOptions =
  PackagedFactoriesFilesystemPullDependencies & {
    pullAllowlistedFiles?: AcquirePackagedFactoryIndexCorpusOptions["pullAllowlistedFiles"];
    /** Absolute committed generated root. Defaults to docs-owned tree. */
    committedRoot?: string;
    /** Docs project root used for default committed-root resolution. */
    projectRoot?: string;
    /**
     * Directory used to resolve `@you-agent-factory/packaged-factories/package.json`.
     * Defaults to the docs project root (host install).
     */
    consumerDir?: string;
  };

export type VerifyCommittedPackagedFactoriesIndexResult = {
  committedRoot: string;
  artifactCount: number;
  sourceHashCount: number;
};

function listRelativeFilesRecursive(
  absoluteDir: string,
  relativePrefix = "",
): string[] {
  const entries = readdirSync(absoluteDir, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries) {
    const relativePath =
      relativePrefix.length === 0
        ? entry.name
        : `${relativePrefix}/${entry.name}`;
    const absolutePath = join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...listRelativeFilesRecursive(absolutePath, relativePath));
      continue;
    }
    if (entry.isFile()) {
      paths.push(relativePath);
    }
  }
  return paths.sort((a, b) => a.localeCompare(b));
}

/**
 * Load every committed file under the generated root as relative-path → UTF-8.
 */
export function loadCommittedPackagedFactoriesIndexArtifacts(
  committedRoot: string,
): PackagedFactoryCorpusArtifactContents[] {
  if (!existsSync(committedRoot)) {
    throw new Error(
      `Committed packaged-factories-index generated root does not exist: ${committedRoot}`,
    );
  }

  return listRelativeFilesRecursive(committedRoot).map((relativePath) => ({
    relativePath,
    contents: readFileSync(join(committedRoot, relativePath), "utf8"),
  }));
}

/**
 * Recompute SHA-256 for each acquired allowlisted source text so drift checks
 * can compare against committed / regenerated manifest hashes.
 */
export function hashAcquiredPackagedFactorySources(
  sources: readonly { relativePath: string; text: string }[],
): PackagedFactoryCorpusSourceHash[] {
  return sources.map((source) => ({
    relativePath: source.relativePath,
    sha256: hashPackagedFactorySourceText(source.text),
  }));
}

/**
 * Fail closed when committed generated outputs diverge from live regeneration,
 * or when regenerated source hashes diverge from hashes of acquired package
 * bytes (which must already equal the committed manifest on a clean tree).
 */
export function verifyCommittedPackagedFactoriesIndex(
  options: VerifyCommittedPackagedFactoriesIndexOptions = {},
): VerifyCommittedPackagedFactoriesIndexResult {
  const {
    projectRoot = getProjectRoot(),
    committedRoot = getPackagedFactoriesIndexGeneratedRoot(projectRoot),
    consumerDir = projectRoot,
    pullAllowlistedFiles,
    ...pullDependencies
  } = options;

  const acquired = acquirePackagedFactoryIndexCorpus({
    consumerDir,
    pullAllowlistedFiles,
    ...pullDependencies,
  });
  const companion = buildDeepResearchCompanionSourceFromPull(acquired.pull);
  const liveBundle = buildPackagedFactoriesIndexGeneratedBundle(
    acquired.corpus,
    companion,
  );

  const committed = loadCommittedPackagedFactoriesIndexArtifacts(committedRoot);
  assertPackagedFactoryGeneratedArtifactsMatch(committed, liveBundle.files);

  const acquiredSources = [
    ...liveBundle.index.entries.map((entry) => ({
      relativePath: entry.sourceRelativePath,
      text: entry.factoryJsonText,
    })),
    {
      relativePath: liveBundle.index.companionSource.relativePath,
      text: liveBundle.index.companionSource.sourceText,
    },
  ];
  const recomputedHashes = hashAcquiredPackagedFactorySources(acquiredSources);
  assertPackagedFactorySourceHashesMatch(
    liveBundle.manifest.sourceHashes,
    recomputedHashes,
  );

  const committedManifest = committed.find(
    (artifact) => artifact.relativePath === "manifest.json",
  );
  if (committedManifest === undefined) {
    throw new Error("Committed generated tree is missing manifest.json.");
  }
  const committedManifestJson = JSON.parse(committedManifest.contents) as {
    sourceHashes: PackagedFactoryCorpusSourceHash[];
  };
  assertPackagedFactorySourceHashesMatch(
    committedManifestJson.sourceHashes,
    recomputedHashes,
  );

  return {
    committedRoot,
    artifactCount: liveBundle.files.length,
    sourceHashCount: recomputedHashes.length,
  };
}
