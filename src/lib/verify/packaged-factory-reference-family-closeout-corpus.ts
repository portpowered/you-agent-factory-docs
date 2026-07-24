/**
 * Batch 5 packaged-factory reference family closeout — story 001 corpus proof.
 *
 * Composes existing generator / drift / index projection surfaces so closeout
 * owns reproducible tip evidence without regenerating the committed corpus or
 * redesigning Batch 1–4 ownership. Fail closed on hash drift, non-determinism,
 * or unabridged definition mismatch.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type PackagedFactoryIndexCorpusLike,
  projectPackagedFactoriesIndex,
} from "@/content/docs/references/packaged-factories-index/project-packaged-factories-index";
import { getProjectRoot } from "@/lib/content/content-paths";
import {
  generatePackagedFactoriesIndex,
  getPackagedFactoriesIndexGeneratedRoot,
} from "@/lib/packaged-factory-generated-source-corpus/generate-packaged-factories-index";
import {
  PACKAGED_FACTORIES_INDEX_MANIFEST_PATH,
  packagedFactoriesIndexFactoryDefinitionArtifactPath,
} from "@/lib/packaged-factory-generated-source-corpus/generated-artifacts-model";
import {
  hashAcquiredPackagedFactorySources,
  verifyCommittedPackagedFactoriesIndex,
} from "@/lib/packaged-factory-generated-source-corpus/verify-committed-corpus";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import {
  PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
  type PackagedFactoriesAllowlistSlug,
} from "@/lib/packaged-factory-v002/packaged-factories-allowlist";

/** Hex-encoded SHA-256 digest length used by the generated corpus manifest. */
export const PACKAGED_FACTORY_CLOSEOUT_SHA256_HEX_LENGTH = 64 as const;

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;

export type PackagedFactoryCloseoutManifestLike = {
  packageVersion: string;
  sourceHashes: ReadonlyArray<{ relativePath: string; sha256: string }>;
};

export type PackagedFactoryCloseoutCorpusEvidence = {
  packageVersion: typeof PACKAGED_FACTORY_V002_VERSION;
  allowlistOrder: readonly PackagedFactoriesAllowlistSlug[];
  sourceHashCount: number;
  artifactCount: number;
  committedRoot: string;
  unabridgedDefinitionSlugs: readonly PackagedFactoriesAllowlistSlug[];
};

export class PackagedFactoryCloseoutCorpusError extends Error {
  readonly code:
    | "wrong-package-version"
    | "missing-source-hash"
    | "invalid-source-hash"
    | "source-hash-order"
    | "definition-mismatch"
    | "non-deterministic-generate";

  constructor(
    code: PackagedFactoryCloseoutCorpusError["code"],
    message: string,
    options?: { cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCloseoutCorpusError";
    this.code = code;
  }
}

/**
 * Expected package-relative source paths recorded in manifest.sourceHashes:
 * seven factory.json definitions in allowlist order, then deep-research companion JS.
 */
export function packagedFactoryCloseoutExpectedSourceRelativePaths(): readonly string[] {
  return [
    ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map(
      (slug) => `factories/${slug}/factory.json`,
    ),
    "factories/deep-research/scripts/deep-research.workflow.js",
  ];
}

/**
 * Fail closed unless the committed/generated manifest records package 0.0.2 and
 * a SHA-256 digest for every allowlisted acquired source in docs order.
 */
export function assertPackagedFactoryCloseoutManifestContract(
  manifest: PackagedFactoryCloseoutManifestLike,
): void {
  if (manifest.packageVersion !== PACKAGED_FACTORY_V002_VERSION) {
    throw new PackagedFactoryCloseoutCorpusError(
      "wrong-package-version",
      `Expected packaged-factories packageVersion ${PACKAGED_FACTORY_V002_VERSION}, got ${manifest.packageVersion}.`,
    );
  }

  const expectedPaths = packagedFactoryCloseoutExpectedSourceRelativePaths();
  if (manifest.sourceHashes.length !== expectedPaths.length) {
    throw new PackagedFactoryCloseoutCorpusError(
      "missing-source-hash",
      `Expected ${expectedPaths.length} sourceHashes, got ${manifest.sourceHashes.length}.`,
    );
  }

  for (const [index, expectedPath] of expectedPaths.entries()) {
    const entry = manifest.sourceHashes[index];
    if (entry === undefined) {
      throw new PackagedFactoryCloseoutCorpusError(
        "missing-source-hash",
        `Missing sourceHashes[${index}] for ${expectedPath}.`,
      );
    }
    if (entry.relativePath !== expectedPath) {
      throw new PackagedFactoryCloseoutCorpusError(
        "source-hash-order",
        `sourceHashes[${index}] path ${entry.relativePath} !== ${expectedPath}.`,
      );
    }
    if (!SHA256_HEX_PATTERN.test(entry.sha256)) {
      throw new PackagedFactoryCloseoutCorpusError(
        "invalid-source-hash",
        `sourceHashes[${index}] sha256 must be ${PACKAGED_FACTORY_CLOSEOUT_SHA256_HEX_LENGTH}-char lowercase hex.`,
      );
    }
  }
}

/**
 * Fail closed when projected index definition panels diverge from committed
 * unabridged `factories/<slug>.factory.json` artifact bytes.
 */
export function assertPackagedFactoryCloseoutUnabridgedDefinitions(options: {
  corpus: PackagedFactoryIndexCorpusLike;
  definitionTextsBySlug: ReadonlyMap<string, string>;
}): readonly PackagedFactoriesAllowlistSlug[] {
  const view = projectPackagedFactoriesIndex(options.corpus);
  const matched: PackagedFactoriesAllowlistSlug[] = [];

  for (const slug of PACKAGED_FACTORIES_ALLOWLIST_SLUGS) {
    const entry = view.entries.find((item) => item.childSlug === slug);
    const onDisk = options.definitionTextsBySlug.get(slug);
    if (entry === undefined || onDisk === undefined) {
      throw new PackagedFactoryCloseoutCorpusError(
        "definition-mismatch",
        `Missing projected or committed factory.json definition for ${slug}.`,
      );
    }
    if (entry.kind !== "factory-json") {
      throw new PackagedFactoryCloseoutCorpusError(
        "definition-mismatch",
        `Closeout expects factory.json panels for ${slug}; got ${entry.kind}.`,
      );
    }
    if (entry.definitionText !== onDisk) {
      throw new PackagedFactoryCloseoutCorpusError(
        "definition-mismatch",
        `Projected definition for ${slug} does not match committed factories/${slug}.factory.json bytes.`,
      );
    }
    matched.push(slug);
  }

  return matched;
}

/**
 * Load committed per-slug factory definition UTF-8 text from the generated tree.
 */
export function loadCommittedPackagedFactoryDefinitionTexts(
  committedRoot: string = getPackagedFactoriesIndexGeneratedRoot(
    getProjectRoot(),
  ),
): Map<PackagedFactoriesAllowlistSlug, string> {
  const texts = new Map<PackagedFactoriesAllowlistSlug, string>();
  for (const slug of PACKAGED_FACTORIES_ALLOWLIST_SLUGS) {
    const relativePath =
      packagedFactoriesIndexFactoryDefinitionArtifactPath(slug);
    texts.set(slug, readFileSync(join(committedRoot, relativePath), "utf8"));
  }
  return texts;
}

/**
 * Load and parse the committed generated manifest.json.
 */
export function loadCommittedPackagedFactoriesIndexManifest(
  committedRoot: string = getPackagedFactoriesIndexGeneratedRoot(
    getProjectRoot(),
  ),
): PackagedFactoryCloseoutManifestLike {
  const contents = readFileSync(
    join(committedRoot, PACKAGED_FACTORIES_INDEX_MANIFEST_PATH),
    "utf8",
  );
  return JSON.parse(contents) as PackagedFactoryCloseoutManifestLike;
}

/**
 * Prove tip generation is byte-stable: a second generate into the same output
 * directory must change zero files and emit identical bundle file bytes.
 */
export function assertPackagedFactoryCloseoutGenerationIsDeterministic(options: {
  outputDir: string;
  consumerDir?: string;
}): void {
  const consumerDir = options.consumerDir ?? getProjectRoot();
  const first = generatePackagedFactoriesIndex({
    consumerDir,
    outputDir: options.outputDir,
  });
  const second = generatePackagedFactoriesIndex({
    consumerDir,
    outputDir: options.outputDir,
  });

  if (second.changedCount !== 0) {
    throw new PackagedFactoryCloseoutCorpusError(
      "non-deterministic-generate",
      `Second generate changed ${second.changedCount} artifact(s); expected 0.`,
    );
  }
  if (
    JSON.stringify(second.bundle.files) !== JSON.stringify(first.bundle.files)
  ) {
    throw new PackagedFactoryCloseoutCorpusError(
      "non-deterministic-generate",
      "Second generate bundle file bytes diverged from the first generate.",
    );
  }
}

/**
 * Run the tip closeout corpus proof for story 001: committed drift verify,
 * manifest hash contract, and unabridged definition/projection alignment.
 */
export function provePackagedFactoryReferenceFamilyCloseoutCorpus(options: {
  projectRoot?: string;
  consumerDir?: string;
  corpus: PackagedFactoryIndexCorpusLike;
}): PackagedFactoryCloseoutCorpusEvidence {
  const projectRoot = options.projectRoot ?? getProjectRoot();
  const consumerDir = options.consumerDir ?? projectRoot;
  const committedRoot = getPackagedFactoriesIndexGeneratedRoot(projectRoot);

  const verified = verifyCommittedPackagedFactoriesIndex({
    projectRoot,
    consumerDir,
    committedRoot,
  });

  const manifest = loadCommittedPackagedFactoriesIndexManifest(committedRoot);
  assertPackagedFactoryCloseoutManifestContract(manifest);

  // Recompute hashes from committed definition + companion artifact text so the
  // closeout evidence path fails closed even if verify helpers are bypassed.
  const definitionTexts =
    loadCommittedPackagedFactoryDefinitionTexts(committedRoot);
  const companion = JSON.parse(
    readFileSync(join(committedRoot, "deep-research.source.json"), "utf8"),
  ) as { relativePath: string; sourceText: string };
  const recomputed = hashAcquiredPackagedFactorySources([
    ...PACKAGED_FACTORIES_ALLOWLIST_SLUGS.map((slug) => ({
      relativePath: `factories/${slug}/factory.json`,
      text: definitionTexts.get(slug) ?? "",
    })),
    {
      relativePath: companion.relativePath,
      text: companion.sourceText,
    },
  ]);
  if (recomputed.length !== manifest.sourceHashes.length) {
    throw new PackagedFactoryCloseoutCorpusError(
      "missing-source-hash",
      "Recomputed source hash count diverged from committed manifest.",
    );
  }
  for (const [index, expected] of recomputed.entries()) {
    const actual = manifest.sourceHashes[index];
    if (
      actual === undefined ||
      actual.relativePath !== expected.relativePath ||
      actual.sha256 !== expected.sha256
    ) {
      throw new PackagedFactoryCloseoutCorpusError(
        "invalid-source-hash",
        `Committed manifest source hash drift at ${expected.relativePath}.`,
      );
    }
  }

  const unabridgedDefinitionSlugs =
    assertPackagedFactoryCloseoutUnabridgedDefinitions({
      corpus: options.corpus,
      definitionTextsBySlug: definitionTexts,
    });

  return {
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
    allowlistOrder: [...PACKAGED_FACTORIES_ALLOWLIST_SLUGS],
    sourceHashCount: verified.sourceHashCount,
    artifactCount: verified.artifactCount,
    committedRoot,
    unabridgedDefinitionSlugs,
  };
}
