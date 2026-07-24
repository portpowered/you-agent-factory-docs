/**
 * Pure generated-artifact model for the packaged-factories-index corpus.
 *
 * Builds deterministic JSON contents for index.json, per-factory definition
 * files, deep-research.source.json, and manifest.json from already-acquired
 * corpus + companion models. No filesystem IO.
 */

import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import {
  PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
  type PackagedFactoriesAllowlistSlug,
} from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import type { PackagedFactoryCompanionSource } from "./companion-source-model";
import {
  hashPackagedFactorySourceText,
  type PackagedFactoryIndexCorpus,
} from "./index-corpus-model";

/** Repo-relative generated tree owned by this lane. */
export const PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT =
  "src/content/docs/references/packaged-factories-index/generated" as const;

export const PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH = "index.json" as const;
export const PACKAGED_FACTORIES_INDEX_MANIFEST_PATH = "manifest.json" as const;
export const PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH =
  "deep-research.source.json" as const;

export const PACKAGED_FACTORIES_INDEX_GENERATED_FORMAT_VERSION = "1" as const;

export type PackagedFactoriesIndexFactoryDefinitionArtifactPath =
  `factories/${PackagedFactoriesAllowlistSlug}.factory.json`;

/** Relative path of the per-slug unabridged factory definition artifact. */
export function packagedFactoriesIndexFactoryDefinitionArtifactPath(
  slug: PackagedFactoriesAllowlistSlug,
): PackagedFactoriesIndexFactoryDefinitionArtifactPath {
  return `factories/${slug}.factory.json`;
}

/**
 * Consolidated index model written to `index.json`.
 * Includes ordered corpus entries (story 001) plus companion source (story 002).
 */
export type PackagedFactoriesIndexGeneratedIndex =
  PackagedFactoryIndexCorpus & {
    companionSource: PackagedFactoryCompanionSource;
  };

export type PackagedFactoriesIndexManifestArtifactKind =
  | "index"
  | "manifest"
  | "factory-definition"
  | "companion-javascript";

export type PackagedFactoriesIndexManifestArtifact = {
  path: string;
  kind: PackagedFactoriesIndexManifestArtifactKind;
  /** SHA-256 of the generated artifact UTF-8 bytes. */
  artifactSha256: string;
  childSlug?: PackagedFactoriesAllowlistSlug;
  /** Package-relative source path when this artifact mirrors an acquired file. */
  sourceRelativePath?: string;
  /** SHA-256 of the acquired package source bytes when applicable. */
  sourceSha256?: string;
};

export type PackagedFactoriesIndexManifestSourceHash = {
  relativePath: string;
  sha256: string;
};

/**
 * Manifest records package version, artifact paths, and source hashes so drift
 * checks can compare generated outputs to the installed package sources.
 */
export type PackagedFactoriesIndexManifest = {
  formatVersion: typeof PACKAGED_FACTORIES_INDEX_GENERATED_FORMAT_VERSION;
  packageName: "@you-agent-factory/packaged-factories";
  packageVersion: typeof PACKAGED_FACTORY_V002_VERSION;
  exportsMapAbsent: boolean;
  generatedRelativeRoot: typeof PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT;
  artifacts: PackagedFactoriesIndexManifestArtifact[];
  sourceHashes: PackagedFactoriesIndexManifestSourceHash[];
};

export type PackagedFactoriesIndexGeneratedArtifactFile = {
  /** Path relative to the generated root. */
  relativePath: string;
  /** Exact UTF-8 contents to write (byte-stable for identical inputs). */
  contents: string;
};

export type PackagedFactoriesIndexGeneratedBundle = {
  index: PackagedFactoriesIndexGeneratedIndex;
  manifest: PackagedFactoriesIndexManifest;
  files: PackagedFactoriesIndexGeneratedArtifactFile[];
};

export type PackagedFactoriesIndexGeneratedArtifactsErrorCode =
  | "corpus-companion-mismatch"
  | "slug-order-mismatch"
  | "missing-factory-entry";

export class PackagedFactoriesIndexGeneratedArtifactsError extends Error {
  readonly code: PackagedFactoriesIndexGeneratedArtifactsErrorCode;

  constructor(
    code: PackagedFactoriesIndexGeneratedArtifactsErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoriesIndexGeneratedArtifactsError";
    this.code = code;
  }
}

/**
 * Deterministic JSON serialization used for all generated JSON artifacts
 * except raw factory definition files (which preserve acquired source bytes).
 */
export function serializePackagedFactoriesIndexGeneratedJson(
  value: unknown,
): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Build the consolidated index model from acquired corpus + companion.
 * Fails closed when package metadata or deep-research identity diverges.
 */
export function buildPackagedFactoriesIndexGeneratedIndex(
  corpus: PackagedFactoryIndexCorpus,
  companionSource: PackagedFactoryCompanionSource,
): PackagedFactoriesIndexGeneratedIndex {
  if (corpus.packageVersion !== companionSource.packageVersion) {
    throw new PackagedFactoriesIndexGeneratedArtifactsError(
      "corpus-companion-mismatch",
      `Corpus package version ${JSON.stringify(corpus.packageVersion)} does not match companion package version ${JSON.stringify(companionSource.packageVersion)}.`,
    );
  }

  const deepResearch = corpus.entries.find(
    (entry) => entry.childSlug === "deep-research",
  );
  if (deepResearch === undefined) {
    throw new PackagedFactoriesIndexGeneratedArtifactsError(
      "missing-factory-entry",
      `Corpus is missing the deep-research entry required to pair companion JavaScript.`,
    );
  }
  if (deepResearch.canonicalName !== companionSource.canonicalName) {
    throw new PackagedFactoriesIndexGeneratedArtifactsError(
      "corpus-companion-mismatch",
      `Companion canonical name ${JSON.stringify(companionSource.canonicalName)} does not match deep-research corpus entry ${JSON.stringify(deepResearch.canonicalName)}.`,
    );
  }

  if (corpus.entries.length !== PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length) {
    throw new PackagedFactoriesIndexGeneratedArtifactsError(
      "slug-order-mismatch",
      `Corpus entry count ${corpus.entries.length} does not match allowlist length ${PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length}.`,
    );
  }

  for (let i = 0; i < PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length; i += 1) {
    const expectedSlug = PACKAGED_FACTORIES_ALLOWLIST_SLUGS[i];
    const entry = corpus.entries[i];
    if (entry === undefined || entry.childSlug !== expectedSlug) {
      throw new PackagedFactoriesIndexGeneratedArtifactsError(
        "slug-order-mismatch",
        `Corpus order mismatch at index ${i}: expected slug "${expectedSlug}", got ${JSON.stringify(entry?.childSlug)}.`,
      );
    }
  }

  return {
    formatVersion: corpus.formatVersion,
    packageName: corpus.packageName,
    packageVersion: corpus.packageVersion,
    exportsMapAbsent: corpus.exportsMapAbsent,
    entries: corpus.entries,
    companionSource,
  };
}

/**
 * Build the full deterministic generated file bundle (index, definitions,
 * companion, manifest) without writing to disk.
 */
export function buildPackagedFactoriesIndexGeneratedBundle(
  corpus: PackagedFactoryIndexCorpus,
  companionSource: PackagedFactoryCompanionSource,
): PackagedFactoriesIndexGeneratedBundle {
  const index = buildPackagedFactoriesIndexGeneratedIndex(
    corpus,
    companionSource,
  );

  const files: PackagedFactoriesIndexGeneratedArtifactFile[] = [];

  const indexContents = serializePackagedFactoriesIndexGeneratedJson(index);
  files.push({
    relativePath: PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH,
    contents: indexContents,
  });

  for (const entry of index.entries) {
    files.push({
      relativePath: packagedFactoriesIndexFactoryDefinitionArtifactPath(
        entry.childSlug,
      ),
      // Preserve exact acquired factory.json UTF-8 bytes (not re-serialized).
      contents: entry.factoryJsonText,
    });
  }

  const companionContents =
    serializePackagedFactoriesIndexGeneratedJson(companionSource);
  files.push({
    relativePath: PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH,
    contents: companionContents,
  });

  const sourceHashes: PackagedFactoriesIndexManifestSourceHash[] = [
    ...index.entries.map((entry) => ({
      relativePath: entry.sourceRelativePath,
      sha256: entry.factoryJsonSha256,
    })),
    {
      relativePath: companionSource.relativePath,
      sha256: companionSource.sourceSha256,
    },
  ];

  // Manifest lists content artifacts only (not itself) so artifact hashes stay
  // byte-stable without a self-referential hash cycle. The manifest file is
  // still written beside them under the generated root.
  const artifacts: PackagedFactoriesIndexManifestArtifact[] = [
    {
      path: PACKAGED_FACTORIES_INDEX_ARTIFACT_PATH,
      kind: "index",
      artifactSha256: hashPackagedFactorySourceText(indexContents),
    },
    ...index.entries.map((entry) => ({
      path: packagedFactoriesIndexFactoryDefinitionArtifactPath(
        entry.childSlug,
      ),
      kind: "factory-definition" as const,
      artifactSha256: hashPackagedFactorySourceText(entry.factoryJsonText),
      childSlug: entry.childSlug,
      sourceRelativePath: entry.sourceRelativePath,
      sourceSha256: entry.factoryJsonSha256,
    })),
    {
      path: PACKAGED_FACTORIES_INDEX_COMPANION_ARTIFACT_PATH,
      kind: "companion-javascript",
      artifactSha256: hashPackagedFactorySourceText(companionContents),
      childSlug: companionSource.childSlug,
      sourceRelativePath: companionSource.relativePath,
      sourceSha256: companionSource.sourceSha256,
    },
  ];

  const manifest: PackagedFactoriesIndexManifest = {
    formatVersion: PACKAGED_FACTORIES_INDEX_GENERATED_FORMAT_VERSION,
    packageName: "@you-agent-factory/packaged-factories",
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
    exportsMapAbsent: index.exportsMapAbsent,
    generatedRelativeRoot: PACKAGED_FACTORIES_INDEX_GENERATED_RELATIVE_ROOT,
    artifacts,
    sourceHashes,
  };

  const manifestContents =
    serializePackagedFactoriesIndexGeneratedJson(manifest);
  files.push({
    relativePath: PACKAGED_FACTORIES_INDEX_MANIFEST_PATH,
    contents: manifestContents,
  });

  return {
    index,
    manifest,
    files,
  };
}
