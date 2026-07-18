/**
 * Build/server-only freshness summary for the `/docs/references` family index.
 *
 * Loads package identity from the public `@you-agent-factory/api/manifest`
 * subpath via W03 helpers. Never invents version strings, never imports the
 * package root, and never patches node_modules. Safe for static export — no
 * live host checks.
 *
 * Next/webpack note: do not rely on `import.meta.resolve` or
 * `createRequire(import.meta.url)` inside the App Router server bundle —
 * worktree bundling resolves the wrong `node_modules` tree. Walk from
 * `process.cwd()` for `node_modules/@you-agent-factory/api/generated/manifest.json`
 * (same parent-walk idea as `scripts/run-next.ts`) and feed that path into W03
 * through the injectable `resolveExport` dependency.
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  ApiPackageArtifactResolutionError,
  type ApiPackageArtifactResolverDependencies,
} from "@/lib/references/api-package-artifact-resolver";
import { ApiPackageManifestParseError } from "@/lib/references/api-package-manifest";
import {
  ApiPackageManifestMembershipError,
  loadApiPackageManifest,
} from "@/lib/references/api-package-manifest-membership";
import { toApiPackageExportSpecifier } from "@/lib/references/api-package-public-exports";

export const REFERENCES_FAMILY_FRESHNESS_ARTIFACT_ID =
  toApiPackageExportSpecifier("manifest");

/** Package-relative path published by `exports["./manifest"]`. */
export const REFERENCES_FAMILY_MANIFEST_PACKAGE_RELATIVE_PATH =
  "generated/manifest.json" as const;

export type ReferencesFamilyFreshnessReady = {
  status: "ready";
  packageId: string;
  packageVersion: string;
  sourceCommit: string;
  publicArtifactId: typeof REFERENCES_FAMILY_FRESHNESS_ARTIFACT_ID;
};

export type ReferencesFamilyFreshnessUnavailable = {
  status: "unavailable";
  reason: string;
};

export type ReferencesFamilyFreshnessSummary =
  | ReferencesFamilyFreshnessReady
  | ReferencesFamilyFreshnessUnavailable;

/**
 * Absolute filesystem path for the installed package manifest, walking from
 * `startDir` through parent `node_modules` trees (worktree-safe).
 */
export function resolveReferencesFamilyManifestFsPath(
  startDir: string = process.cwd(),
): string {
  let currentDir = startDir;

  while (true) {
    const candidate = join(
      currentDir,
      "node_modules",
      "@you-agent-factory",
      "api",
      REFERENCES_FAMILY_MANIFEST_PACKAGE_RELATIVE_PATH,
    );
    if (existsSync(candidate)) {
      return candidate;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(
        `Installed @you-agent-factory/api manifest not found under node_modules from ${startDir}. Expected ${REFERENCES_FAMILY_MANIFEST_PACKAGE_RELATIVE_PATH} in this workspace or a parent directory.`,
      );
    }
    currentDir = parentDir;
  }
}

/**
 * Resolve `@you-agent-factory/api/manifest` to a `file:` URL for W03 acquisition.
 */
export function resolveReferencesFamilyManifestExport(
  specifier: string = REFERENCES_FAMILY_FRESHNESS_ARTIFACT_ID,
): string {
  if (specifier !== REFERENCES_FAMILY_FRESHNESS_ARTIFACT_ID) {
    throw new Error(
      `References family freshness resolver only accepts "${REFERENCES_FAMILY_FRESHNESS_ARTIFACT_ID}", got "${specifier}".`,
    );
  }
  return pathToFileURL(resolveReferencesFamilyManifestFsPath()).href;
}

function reasonFromUnknown(error: unknown): string {
  if (error instanceof ApiPackageManifestMembershipError) {
    return error.message;
  }
  if (error instanceof ApiPackageArtifactResolutionError) {
    return error.message;
  }
  if (error instanceof ApiPackageManifestParseError) {
    return error.message;
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "The published API package manifest could not be read.";
}

/**
 * Acquire a lightweight package/version freshness summary for the references
 * family index. Failures return an explicit unavailable result so the index
 * can still render introduction and discoverability links.
 */
export function loadReferencesFamilyFreshnessSummary(
  dependencies: ApiPackageArtifactResolverDependencies = {},
): ReferencesFamilyFreshnessSummary {
  try {
    const manifest = loadApiPackageManifest({
      resolveExport: resolveReferencesFamilyManifestExport,
      ...dependencies,
    });
    return {
      status: "ready",
      packageId: manifest.packageId,
      packageVersion: manifest.packageVersion,
      sourceCommit: manifest.sourceCommit,
      publicArtifactId: REFERENCES_FAMILY_FRESHNESS_ARTIFACT_ID,
    };
  } catch (error) {
    return {
      status: "unavailable",
      reason: reasonFromUnknown(error),
    };
  }
}
