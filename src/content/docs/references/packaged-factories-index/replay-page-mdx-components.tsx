/**
 * Shared page MDX component map for standard packaged-factories-index replay
 * children: goal, subagent, fusion, review, quorum, tts.
 *
 * Thin placeholder until Batch 4 authors child page bodies. Keep this module
 * free of parent index mounts. Do not register these in the shared module MDX
 * map. Route-family loader cases import this file with literal static
 * specifiers so Next’s static export bundler can resolve nested child maps.
 */
export const packagedFactoriesIndexChildComponentMapKind =
  "standard-replay" as const;

/**
 * Placeholder MDX map for standard replay children. Batch 4 fills replay
 * mounts here; this lane only registers the literal import path.
 */
export const pageMdxComponents = {};
