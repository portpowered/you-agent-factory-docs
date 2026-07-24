/**
 * Build-only acquisition of allowlisted deep-research companion JavaScript.
 *
 * Reuses the docs-owned packaged-factories filesystem pull. The Batch 1 pull
 * treats companion JS as optional at the allowlist layer; this corpus lane
 * fails closed when the required companion path is absent or unreadable —
 * never invents substitute JavaScript source.
 *
 * Does not parse, execute, traverse, interpret, or summarize the companion
 * script body.
 */

import { getProjectRoot } from "@/lib/content/content-paths";
import {
  type PackagedFactoriesFilesystemPullDependencies,
  type PackagedFactoriesFilesystemPullResult,
  pullPackagedFactoriesAllowlistedFiles,
} from "@/lib/packaged-factory-v002/packaged-factories-filesystem-pull";
import {
  buildDeepResearchCompanionSource,
  DEEP_RESEARCH_CHILD_SLUG,
  DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
  type PackagedFactoryCompanionSource,
  PackagedFactoryCompanionSourceError,
} from "./companion-source-model";

export type AcquireDeepResearchCompanionSourceDependencies =
  PackagedFactoriesFilesystemPullDependencies & {
    pullAllowlistedFiles?: (
      consumerDir: string,
      dependencies?: PackagedFactoriesFilesystemPullDependencies,
    ) => PackagedFactoriesFilesystemPullResult;
  };

export type AcquireDeepResearchCompanionSourceOptions = {
  /**
   * Directory used to resolve `@you-agent-factory/packaged-factories/package.json`.
   * Defaults to the docs project root (host install).
   */
  consumerDir?: string;
} & AcquireDeepResearchCompanionSourceDependencies;

export type AcquireDeepResearchCompanionSourceResult = {
  companion: PackagedFactoryCompanionSource;
  packageRoot: string;
  pull: PackagedFactoriesFilesystemPullResult;
};

/**
 * Extract the allowlisted deep-research companion file from a filesystem pull
 * result. Fails closed when the companion path is missing from `optionalPresent`.
 */
export function companionSourceTextFromPackagedFactoriesPull(
  pull: PackagedFactoriesFilesystemPullResult,
): {
  relativePath: typeof DEEP_RESEARCH_COMPANION_RELATIVE_PATH;
  text: string;
} {
  const companion = pull.optionalPresent.find(
    (file) => file.relativePath === DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
  );

  if (companion === undefined) {
    throw new PackagedFactoryCompanionSourceError(
      "missing-allowlisted-companion",
      `Allowlisted companion JavaScript "${DEEP_RESEARCH_COMPANION_RELATIVE_PATH}" is missing under installed packaged-factories@${pull.installedVersion}; refusing to invent substitute source.`,
      { relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH },
    );
  }

  return {
    relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
    text: companion.text,
  };
}

/**
 * Read canonical name from the pulled deep-research factory.json (required
 * allowlisted definition). Does not inspect companion JavaScript.
 */
export function deepResearchCanonicalNameFromPackagedFactoriesPull(
  pull: PackagedFactoriesFilesystemPullResult,
): string {
  const definition = pull.required.find(
    (file) =>
      file.relativePath ===
      `factories/${DEEP_RESEARCH_CHILD_SLUG}/factory.json`,
  );

  if (definition === undefined) {
    throw new PackagedFactoryCompanionSourceError(
      "invalid-companion-metadata",
      `Missing allowlisted deep-research factory.json needed for companion canonical name.`,
      { relativePath: `factories/${DEEP_RESEARCH_CHILD_SLUG}/factory.json` },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(definition.text);
  } catch (cause) {
    throw new PackagedFactoryCompanionSourceError(
      "invalid-companion-metadata",
      `deep-research factory.json did not parse as JSON; cannot read canonical name for companion metadata.`,
      {
        relativePath: `factories/${DEEP_RESEARCH_CHILD_SLUG}/factory.json`,
        cause,
      },
    );
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    typeof (parsed as { name?: unknown }).name !== "string" ||
    (parsed as { name: string }).name.trim().length === 0
  ) {
    throw new PackagedFactoryCompanionSourceError(
      "invalid-companion-metadata",
      `deep-research factory.json is missing a non-empty string "name" for companion metadata.`,
      { relativePath: `factories/${DEEP_RESEARCH_CHILD_SLUG}/factory.json` },
    );
  }

  return (parsed as { name: string }).name;
}

/**
 * Build companion source from an already-completed filesystem pull without
 * re-resolving the package. Fail closed when companion is absent.
 */
export function buildDeepResearchCompanionSourceFromPull(
  pull: PackagedFactoriesFilesystemPullResult,
): PackagedFactoryCompanionSource {
  const companion = companionSourceTextFromPackagedFactoriesPull(pull);
  const canonicalName =
    deepResearchCanonicalNameFromPackagedFactoriesPull(pull);

  return buildDeepResearchCompanionSource({
    sourceText: companion.text,
    relativePath: companion.relativePath,
    canonicalName,
    packageVersion: pull.installedVersion,
  });
}

/**
 * Acquire the allowlisted deep-research companion JavaScript from installed
 * packaged-factories@0.0.2 as complete raw text plus straightforward metadata.
 *
 * Fail closed when the companion path is missing/unreadable, the package
 * version is wrong, or factory metadata needed for canonical name is invalid.
 * Never invents substitute JavaScript. Never interprets the script body.
 */
export function acquireDeepResearchCompanionSource(
  options: AcquireDeepResearchCompanionSourceOptions = {},
): AcquireDeepResearchCompanionSourceResult {
  const {
    consumerDir = getProjectRoot(),
    pullAllowlistedFiles = pullPackagedFactoriesAllowlistedFiles,
    ...pullDependencies
  } = options;

  const pull = pullAllowlistedFiles(consumerDir, pullDependencies);
  const companion = buildDeepResearchCompanionSourceFromPull(pull);

  return {
    companion,
    packageRoot: pull.packageRoot,
    pull,
  };
}
