/**
 * Build/server-only format-version gate for consumed `@you-agent-factory/api`
 * public exports.
 *
 * Runs after public-subpath resolution and manifest membership validation.
 * Accepts known versions for the currently installed package and fails closed
 * on unsupported versions or missing required artifacts. Do not import from
 * client/browser UI code.
 */

import {
  ApiPackageArtifactResolutionError,
  type ApiPackageArtifactResolverDependencies,
} from "./api-package-artifact-resolver";
import {
  ApiPackageFormatVersionError,
  assertSupportedApiPackageExportFormatVersions,
  missingRequiredApiPackageArtifactMessage,
} from "./api-package-format-versions";
import {
  type ApiPackageManifestMembershipDependencies,
  ApiPackageManifestMembershipError,
  loadApiPackageManifest,
  type ValidatedApiPackageExportMembership,
  validateConsumedApiPackageExportMembership,
} from "./api-package-manifest-membership";

export type ApiPackageFormatVersionGateDependencies =
  ApiPackageManifestMembershipDependencies;

export type ValidatedApiPackageExportFormatVersions =
  ValidatedApiPackageExportMembership & {
    /** Caller-supplied consumer identity used for missing-artifact diagnostics. */
    dependentReferenceFamily: string;
  };

export type ValidateConsumedApiPackageExportFormatVersionsOptions = {
  /**
   * Dependent reference family (or equivalent consumer identity) that requires
   * this artifact. Named in missing-artifact failures.
   */
  dependentReferenceFamily: string;
} & ApiPackageFormatVersionGateDependencies;

function wrapMissingArtifactFailure(
  error: unknown,
  options: {
    target: string;
    dependentReferenceFamily: string;
  },
): never {
  if (error instanceof ApiPackageFormatVersionError) {
    throw error;
  }

  if (error instanceof ApiPackageArtifactResolutionError) {
    const subpath = error.subpath ?? options.target;
    if (error.code === "missing-export" || error.code === "illegal-target") {
      throw new ApiPackageFormatVersionError(
        "missing-artifact",
        missingRequiredApiPackageArtifactMessage({
          subpath,
          dependentReferenceFamily: options.dependentReferenceFamily,
          detail: error.message,
        }),
        {
          subpath,
          dependentReferenceFamily: options.dependentReferenceFamily,
          cause: error,
        },
      );
    }
    throw error;
  }

  if (error instanceof ApiPackageManifestMembershipError) {
    const subpath = error.subpath ?? options.target;
    if (
      error.code === "missing-membership" ||
      error.code === "unresolvable-path"
    ) {
      throw new ApiPackageFormatVersionError(
        "missing-artifact",
        missingRequiredApiPackageArtifactMessage({
          subpath,
          dependentReferenceFamily: options.dependentReferenceFamily,
          detail: error.message,
        }),
        {
          subpath,
          dependentReferenceFamily: options.dependentReferenceFamily,
          cause: error,
        },
      );
    }
    throw error;
  }

  throw error;
}

/**
 * Resolve, membership-validate, and format-version-gate one consumed public
 * export. Known supported versions succeed; unsupported versions and missing
 * required artifacts fail closed with actionable diagnostics.
 */
export function validateConsumedApiPackageExportFormatVersions(
  target: string,
  options: ValidateConsumedApiPackageExportFormatVersionsOptions,
): ValidatedApiPackageExportFormatVersions {
  const { dependentReferenceFamily, ...dependencies } = options;

  let membership: ValidatedApiPackageExportMembership;
  try {
    membership = validateConsumedApiPackageExportMembership(
      target,
      dependencies,
    );
  } catch (error) {
    wrapMissingArtifactFailure(error, {
      target,
      dependentReferenceFamily,
    });
  }

  assertSupportedApiPackageExportFormatVersions({
    manifest: membership.manifest,
    entry: membership.entry,
    artifactData: membership.artifact.data,
    context: {
      subpath: membership.subpath,
      exportId: membership.exportId,
      dependentReferenceFamily,
    },
  });

  return {
    ...membership,
    dependentReferenceFamily,
  };
}

/**
 * Format-version-gate several consumed public exports. Each target maps to the
 * dependent reference family that requires it. Shares one loaded manifest
 * authority across the batch when the caller does not inject one.
 */
export function validateConsumedApiPackageExportFormatVersionsForFamilies(
  requirements: ReadonlyArray<{
    target: string;
    dependentReferenceFamily: string;
  }>,
  dependencies: ApiPackageArtifactResolverDependencies &
    Pick<ApiPackageManifestMembershipDependencies, "manifest"> = {},
): ValidatedApiPackageExportFormatVersions[] {
  const sharedManifest =
    dependencies.manifest ?? loadApiPackageManifest(dependencies);

  return requirements.map((requirement) =>
    validateConsumedApiPackageExportFormatVersions(requirement.target, {
      ...dependencies,
      manifest: sharedManifest,
      dependentReferenceFamily: requirement.dependentReferenceFamily,
    }),
  );
}

export {
  ApiPackageFormatVersionError,
  SUPPORTED_API_PACKAGE_ARTIFACT_BODY_FORMAT_VERSIONS,
  SUPPORTED_API_PACKAGE_DOCUMENTATION_FORMAT_VERSION,
  SUPPORTED_API_PACKAGE_FAMILY_FORMAT_VERSIONS,
  SUPPORTED_API_PACKAGE_LIFECYCLE_FORMAT_VERSION,
  SUPPORTED_API_PACKAGE_MANIFEST_FORMAT_VERSION,
} from "./api-package-format-versions";
