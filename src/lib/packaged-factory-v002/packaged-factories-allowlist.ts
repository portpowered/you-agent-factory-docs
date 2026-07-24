/**
 * Docs-owned allowlist for direct filesystem acquisition of
 * `@you-agent-factory/packaged-factories@0.0.2`.
 *
 * Pure constants only — no filesystem IO. Published 0.0.2 ships
 * `files: ["factories"]` with no `exports` map; consumers resolve the package
 * root and read only these relative paths.
 */

export const PACKAGED_FACTORIES_PACKAGE_NAME =
  "@you-agent-factory/packaged-factories" as const;

/**
 * Factory slug order required by the Batch 1 acquisition contract.
 * Order is intentional: goal → subagent → fusion → review → quorum → tts →
 * deep-research.
 */
export const PACKAGED_FACTORIES_ALLOWLIST_SLUGS = [
  "goal",
  "subagent",
  "fusion",
  "review",
  "quorum",
  "tts",
  "deep-research",
] as const;

export type PackagedFactoriesAllowlistSlug =
  (typeof PACKAGED_FACTORIES_ALLOWLIST_SLUGS)[number];

/**
 * Required relative paths under the installed packaged-factories package root.
 * Every path must exist and be readable for the proof to pass.
 */
export const PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS = [
  "factories/goal/factory.json",
  "factories/subagent/factory.json",
  "factories/fusion/factory.json",
  "factories/review/factory.json",
  "factories/quorum/factory.json",
  "factories/tts/factory.json",
  "factories/deep-research/factory.json",
] as const;

/**
 * Optional companion files under deep-research. When present they must be
 * readable and stay inside the package root; absence is allowed.
 */
export const PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS = [
  "factories/deep-research/scripts/deep-research.workflow.js",
] as const;

export type PackagedFactoriesAllowlistedRelativePath =
  | (typeof PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS)[number]
  | (typeof PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS)[number];

/** True when `relativePath` is on the docs-owned required or optional allowlist. */
export function isPackagedFactoriesAllowlistedRelativePath(
  relativePath: string,
): relativePath is PackagedFactoriesAllowlistedRelativePath {
  return (
    (PACKAGED_FACTORIES_REQUIRED_RELATIVE_PATHS as readonly string[]).includes(
      relativePath,
    ) ||
    (
      PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS as readonly string[]
    ).includes(relativePath)
  );
}

/** Factory definition path for one allowlisted slug. */
export function packagedFactoriesFactoryJsonRelativePath(
  slug: PackagedFactoriesAllowlistSlug,
): `factories/${PackagedFactoriesAllowlistSlug}/factory.json` {
  return `factories/${slug}/factory.json`;
}
