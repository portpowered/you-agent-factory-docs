/**
 * Browser-bundle exclusion contract for the W03 `@you-agent-factory/api`
 * acquisition surface.
 *
 * Pure modules may appear in client-safe bundles. Node filesystem / package
 * resolution modules must remain build/server-only and must not ship in browser
 * chunks. Evaluation helpers inspect emitted bundle text; bundling itself stays
 * in build/server callers (tests or prepare steps).
 */

/** Repo-relative paths of IO-free acquisition helpers safe for browser bundles. */
export const API_PACKAGE_BROWSER_SAFE_ACQUISITION_MODULES = [
  "src/lib/references/api-package-public-exports.ts",
  "src/lib/references/api-package-manifest.ts",
  "src/lib/references/api-package-format-versions.ts",
  "src/lib/references/api-package-consumed-hash-ledger.ts",
] as const;

/**
 * Repo-relative paths of build/server-only acquisition modules that depend on
 * Node filesystem APIs and/or package export resolution.
 */
export const API_PACKAGE_SERVER_ONLY_ACQUISITION_MODULES = [
  "src/lib/references/api-package-artifact-resolver.ts",
  "src/lib/references/api-package-manifest-membership.ts",
  "src/lib/references/api-package-format-version-gate.ts",
  "src/lib/references/api-package-consumed-hash-ledger-generation.ts",
] as const;

export type ApiPackageAcquisitionBrowserLeakMarker =
  | "node:fs"
  | "node:url"
  | "readFileSync"
  | "import.meta.resolve"
  | "fileURLToPath";

const LEAK_MARKERS: ReadonlyArray<ApiPackageAcquisitionBrowserLeakMarker> = [
  "node:fs",
  "node:url",
  "readFileSync",
  "import.meta.resolve",
  "fileURLToPath",
];

export type ApiPackageAcquisitionBrowserLeakEvaluation = {
  /** True when the bundle text contains Node filesystem/resolution markers. */
  leaksNodeAcquisitionApis: boolean;
  /** Markers observed in the bundle text. */
  markers: ApiPackageAcquisitionBrowserLeakMarker[];
};

/**
 * Evaluate emitted browser-bundle text for Node filesystem / package-resolution
 * APIs attributable to the W03 acquisition surface.
 */
export function evaluateApiPackageAcquisitionBrowserBundleLeakage(
  bundleText: string,
): ApiPackageAcquisitionBrowserLeakEvaluation {
  const markers = LEAK_MARKERS.filter((marker) => bundleText.includes(marker));
  return {
    leaksNodeAcquisitionApis: markers.length > 0,
    markers: [...markers],
  };
}

export type ApiPackageAcquisitionBrowserBundleAttempt = {
  /** Repo-relative entrypoint that was bundled. */
  entrypoint: string;
  /** Whether the browser-targeted bundle succeeded. */
  success: boolean;
  /** Concatenated emitted JS when the build succeeded. */
  bundleText: string;
  /** Bundler diagnostic messages when the build failed. */
  failureMessages: string[];
};

/**
 * True when a browser-targeted bundle attempt proves the entrypoint cannot ship
 * as a client chunk: either the build fails closed, or a successful emit still
 * contains Node acquisition API markers (which must not pass the contract).
 */
export function isApiPackageAcquisitionModuleExcludedFromBrowserBundles(
  attempt: ApiPackageAcquisitionBrowserBundleAttempt,
): boolean {
  if (!attempt.success) {
    return true;
  }

  return evaluateApiPackageAcquisitionBrowserBundleLeakage(attempt.bundleText)
    .leaksNodeAcquisitionApis;
}

/**
 * True when a successful browser bundle of a pure acquisition helper stays free
 * of Node filesystem / package-resolution markers.
 */
export function isApiPackageAcquisitionBrowserSafeBundleClean(
  attempt: ApiPackageAcquisitionBrowserBundleAttempt,
): boolean {
  if (!attempt.success) {
    return false;
  }

  return !evaluateApiPackageAcquisitionBrowserBundleLeakage(attempt.bundleText)
    .leaksNodeAcquisitionApis;
}
