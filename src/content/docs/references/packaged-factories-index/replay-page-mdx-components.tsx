/**
 * Shared page MDX component map for remaining standard packaged-factories-index
 * replay children still on the placeholder: subagent, fusion, review, quorum,
 * tts. Goal resolves its child-owned map instead.
 *
 * Thin placeholder until Batch 4 authors sibling child page bodies. Keep this
 * module free of parent index mounts and free of packaged-factory recording
 * imports. Do not register these in the shared module MDX map. Route-family
 * loader cases import this file with literal static specifiers so Next’s
 * static export bundler can resolve nested child maps.
 */
export const packagedFactoriesIndexChildComponentMapKind =
  "standard-replay" as const;

/**
 * Placeholder MDX map for standard replay children. Batch 4 fills replay
 * mounts here; this lane only registers the literal import path.
 */
export const pageMdxComponents = {};
