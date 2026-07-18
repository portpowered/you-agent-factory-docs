/**
 * Build/server-only membership validation for consumed `@you-agent-factory/api`
 * public exports against the published package manifest.
 *
 * Loads the manifest only through its documented public subpath and treats it
 * as the membership authority. Does not invent or patch missing manifest
 * entries. Do not import from client/browser UI code.
 */

import {
  ApiPackageArtifactResolutionError,
  type ApiPackageArtifactResolverDependencies,
  type ResolvedApiPackageArtifact,
  resolveApiPackageArtifact,
} from "./api-package-artifact-resolver";
import {
  type ApiPackageManifest,
  type ApiPackageManifestExportEntry,
  ApiPackageManifestParseError,
  indexApiPackageManifestExportsByPath,
  packageRelativePathFromResolvedArtifactPath,
  parseApiPackageManifest,
} from "./api-package-manifest";
export type ApiPackageManifestMembershipErrorCode =
  | "malformed-manifest"
  | "missing-membership"
  | "malformed-membership"
  | "unresolvable-path";

export class ApiPackageManifestMembershipError extends Error {
  readonly code: ApiPackageManifestMembershipErrorCode;
  readonly subpath?: string;
  readonly exportId?: string;
  readonly field?: string;

  constructor(
    code: ApiPackageManifestMembershipErrorCode,
    message: string,
    options: {
      subpath?: string;
      exportId?: string;
      field?: string;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "ApiPackageManifestMembershipError";
    this.code = code;
    this.subpath = options.subpath;
    this.exportId = options.exportId;
    this.field = options.field;
  }
}

export type ValidatedApiPackageExportMembership = {
  /** Documented public subpath that was validated. */
  subpath: string;
  /** Canonical package export specifier. */
  specifier: string;
  /** Manifest export identity (for example `generated.cli.commands`). */
  exportId: string;
  /** Package-relative artifact path recorded in the manifest. */
  path: string;
  entry: ApiPackageManifestExportEntry;
  artifact: ResolvedApiPackageArtifact;
  manifest: ApiPackageManifest;
};

export type ApiPackageManifestMembershipDependencies =
  ApiPackageArtifactResolverDependencies & {
    /**
     * Optional preloaded manifest authority. When omitted, loads
     * `@you-agent-factory/api/manifest` through the public-subpath resolver.
     */
    manifest?: ApiPackageManifest;
  };

function wrapManifestParseError(
  error: ApiPackageManifestParseError,
  subpath?: string,
): ApiPackageManifestMembershipError {
  const code: ApiPackageManifestMembershipErrorCode =
    error.code === "malformed-manifest"
      ? "malformed-manifest"
      : "malformed-membership";

  return new ApiPackageManifestMembershipError(code, error.message, {
    subpath,
    exportId: error.exportId,
    field: error.field,
    cause: error,
  });
}

/**
 * Load the installed package manifest through its public subpath and parse it
 * as the membership authority for consumed exports.
 */
export function loadApiPackageManifest(
  dependencies: ApiPackageArtifactResolverDependencies = {},
): ApiPackageManifest {
  let artifact: ResolvedApiPackageArtifact;
  try {
    artifact = resolveApiPackageArtifact("manifest", dependencies);
  } catch (error) {
    if (error instanceof ApiPackageArtifactResolutionError) {
      throw new ApiPackageManifestMembershipError(
        "malformed-manifest",
        `Failed to load @you-agent-factory/api/manifest as the membership authority: ${error.message}`,
        { subpath: "manifest", cause: error },
      );
    }
    throw error;
  }

  try {
    return parseApiPackageManifest(artifact.data);
  } catch (error) {
    if (error instanceof ApiPackageManifestParseError) {
      throw wrapManifestParseError(error, "manifest");
    }
    throw error;
  }
}

/**
 * Validate that a consumed public export exists in the published manifest and
 * that its family, path, lifecycle/documentation metadata, and hash fields
 * have the expected shape. Reads only the published package — never invents
 * missing membership entries.
 */
export function validateConsumedApiPackageExportMembership(
  target: string,
  dependencies: ApiPackageManifestMembershipDependencies = {},
): ValidatedApiPackageExportMembership {
  const artifact = resolveApiPackageArtifact(target, dependencies);
  const manifest =
    dependencies.manifest ?? loadApiPackageManifest(dependencies);

  if (artifact.subpath === "manifest") {
    // The publication manifest is the membership authority itself and is not
    // listed under `exports`. Loading it via loadApiPackageManifest is the
    // supported authority path; membership checks apply to consumed artifacts.
    throw new ApiPackageManifestMembershipError(
      "missing-membership",
      `Public export "@you-agent-factory/api/manifest" is the membership authority, not a member export. Validate consumed artifacts (for example openapi, cli, mcp) against the loaded manifest instead of treating the manifest as a member.`,
      { subpath: artifact.subpath },
    );
  }

  const packageRelativePath = packageRelativePathFromResolvedArtifactPath(
    artifact.resolvedPath,
  );
  if (packageRelativePath === null) {
    throw new ApiPackageManifestMembershipError(
      "unresolvable-path",
      `Could not derive a package-relative artifact path for consumed @you-agent-factory/api/${artifact.subpath} resolved to "${artifact.resolvedPath}".`,
      { subpath: artifact.subpath },
    );
  }

  const byPath = indexApiPackageManifestExportsByPath(manifest);
  const membership = byPath.get(packageRelativePath);
  if (membership === undefined) {
    throw new ApiPackageManifestMembershipError(
      "missing-membership",
      `Consumed @you-agent-factory/api public export "${artifact.specifier}" (subpath "${artifact.subpath}", path "${packageRelativePath}") is missing from the published package manifest. Validation does not invent or patch missing manifest entries.`,
      { subpath: artifact.subpath },
    );
  }

  const { exportId, entry } = membership;
  if (entry.path !== packageRelativePath) {
    throw new ApiPackageManifestMembershipError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": recorded path "${entry.path}" does not match resolved package path "${packageRelativePath}" for subpath "${artifact.subpath}".`,
      {
        subpath: artifact.subpath,
        exportId,
        field: "path",
      },
    );
  }

  // Membership entries from loadApiPackageManifest are already shape-checked.
  // Require the critical fields again so injected fixtures cannot skip the
  // family / hash / lifecycle / documentation contract.
  if (
    typeof entry.family !== "string" ||
    entry.family.length === 0 ||
    typeof entry.artifactHash !== "string" ||
    entry.artifactHash.length === 0 ||
    entry.lifecycle === undefined ||
    entry.documentation === undefined
  ) {
    throw new ApiPackageManifestMembershipError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}" consumed via "${artifact.specifier}": family, path, lifecycle/documentation metadata, and hash fields must have the expected shape.`,
      { subpath: artifact.subpath, exportId },
    );
  }

  return {
    subpath: artifact.subpath,
    specifier: artifact.specifier,
    exportId,
    path: entry.path,
    entry,
    artifact,
    manifest,
  };
}

/**
 * Validate several consumed public exports against one loaded manifest authority.
 */
export function validateConsumedApiPackageExportMemberships(
  targets: readonly string[],
  dependencies: ApiPackageManifestMembershipDependencies = {},
): ValidatedApiPackageExportMembership[] {
  const manifest =
    dependencies.manifest ?? loadApiPackageManifest(dependencies);

  return targets.map((target) =>
    validateConsumedApiPackageExportMembership(target, {
      ...dependencies,
      manifest,
    }),
  );
}
