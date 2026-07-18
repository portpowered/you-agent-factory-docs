/**
 * W20 story 009: package acquisition / resolver client-chunk exclusion
 * convergence.
 *
 * Owns the reviewer-followable inventory of W03 browser-bundle exclusion
 * proofs on the post-W19 tip. Confirms browser-safe acquisition helpers stay
 * free of Node filesystem / package-resolution APIs, and server-only resolver
 * modules do not ship cleanly as client chunks. Does not reopen W03 package
 * ownership or patch node_modules.
 */

import {
  API_PACKAGE_BROWSER_SAFE_ACQUISITION_MODULES,
  API_PACKAGE_SERVER_ONLY_ACQUISITION_MODULES,
} from "@/lib/references/api-package-acquisition-browser-exclusion";

export type W20ClientChunkExclusionGateFamily =
  | "browser-safe-helper-chunks"
  | "server-only-resolver-exclusion"
  | "leak-marker-evaluation"
  | "acquisition-module-inventory";

export type W20ClientChunkExclusionSuiteEntry = {
  /** Repo-relative bun test path. */
  path: string;
  /** Gate families this suite proves for §17 / FR-11 convergence. */
  families: readonly W20ClientChunkExclusionGateFamily[];
};

/**
 * Focused suites: browser-target bundling of acquisition modules plus leak
 * marker evaluation. Package-internal illegal-target rejection lives in the
 * same file and stays catalogued for evidence.
 */
export const W20_CLIENT_CHUNK_EXCLUSION_SUITE_ENTRIES = [
  {
    path: "src/lib/references/api-package-acquisition-browser-exclusion.test.ts",
    families: [
      "browser-safe-helper-chunks",
      "server-only-resolver-exclusion",
      "leak-marker-evaluation",
      "acquisition-module-inventory",
    ],
  },
] as const satisfies readonly W20ClientChunkExclusionSuiteEntry[];

/** Pure acquisition helpers allowed in browser-safe client chunks. */
export const W20_CLIENT_CHUNK_BROWSER_SAFE_MODULES =
  API_PACKAGE_BROWSER_SAFE_ACQUISITION_MODULES;

/**
 * Build/server-only acquisition modules that must fail closed (or leak
 * markers) when pulled into a browser-targeted chunk.
 */
export const W20_CLIENT_CHUNK_SERVER_ONLY_MODULES =
  API_PACKAGE_SERVER_ONLY_ACQUISITION_MODULES;

export const W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_TEST_PATHS =
  W20_CLIENT_CHUNK_EXCLUSION_SUITE_ENTRIES.map((entry) => entry.path);

export const W20_CLIENT_CHUNK_EXCLUSION_REQUIRED_FAMILIES = [
  "browser-safe-helper-chunks",
  "server-only-resolver-exclusion",
  "leak-marker-evaluation",
  "acquisition-module-inventory",
] as const satisfies readonly W20ClientChunkExclusionGateFamily[];

export const W20_CLIENT_CHUNK_EXCLUSION_SUITE_COMMAND =
  "make test-w20-client-chunk-exclusion";

export function listW20ClientChunkExclusionCoveredFamilies(): W20ClientChunkExclusionGateFamily[] {
  const covered = new Set<W20ClientChunkExclusionGateFamily>();
  for (const entry of W20_CLIENT_CHUNK_EXCLUSION_SUITE_ENTRIES) {
    for (const family of entry.families) {
      covered.add(family);
    }
  }
  return [...covered].sort();
}
