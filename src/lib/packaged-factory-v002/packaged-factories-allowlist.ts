/**
 * Docs-owned allowlist for direct filesystem acquisition of
 * `@you-agent-factory/packaged-factories`.
 *
 * Pure constants only — no filesystem IO. Consumers resolve the package root
 * and read only these relative paths.
 *
 * 0.0.6 moved the catalog from `factories/` to `generated/factories/` and added
 * an `exports` map; the relative paths below track that move. It also dropped
 * the deep-research companion JavaScript, which is why the optional companion
 * list is now empty.
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
  "generated/factories/goal/factory.json",
  "generated/factories/subagent/factory.json",
  "generated/factories/fusion/factory.json",
  "generated/factories/review/factory.json",
  "generated/factories/quorum/factory.json",
  "generated/factories/tts/factory.json",
  "generated/factories/deep-research/factory.json",
] as const;

/**
 * Optional companion files under deep-research. When present they must be
 * readable and stay inside the package root; absence is allowed.
 *
 * Empty since 0.0.6: the package no longer ships
 * `scripts/deep-research.workflow.js` (or any other JavaScript). Kept as a
 * declared surface so a companion returning upstream is re-allowlisted here
 * rather than read ad hoc.
 */
export const PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS =
  [] as const satisfies readonly string[];

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
): `generated/factories/${PackagedFactoriesAllowlistSlug}/factory.json` {
  return `generated/factories/${slug}/factory.json`;
}
