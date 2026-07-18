/**
 * Pure format-version allowlist and checks for `@you-agent-factory/api` artifacts.
 *
 * The docs build intentionally pins the versions it can read. Later package
 * upgrades that publish unknown versions fail closed until this allowlist is
 * updated. Keep this module free of filesystem and package-resolution IO.
 */

import type {
  ApiPackageManifest,
  ApiPackageManifestExportEntry,
} from "./api-package-manifest";

/** Supported publication-manifest `formatVersion` for the installed package. */
export const SUPPORTED_API_PACKAGE_MANIFEST_FORMAT_VERSION = "1.0.0" as const;

/**
 * Supported `familyFormatVersions` values published by the installed package.
 * Keys are family ids (`cli`, `mcp`, …); values are the exact version strings
 * this docs build accepts.
 */
export const SUPPORTED_API_PACKAGE_FAMILY_FORMAT_VERSIONS = {
  cli: "1.0.0",
  config: "1.0.0",
  javascript: "1.0.0",
  mcp: "1.0.0",
  openapi: "1.0.0",
  shared: "1.0.0",
} as const satisfies Record<string, string>;

export type SupportedApiPackageFamily =
  keyof typeof SUPPORTED_API_PACKAGE_FAMILY_FORMAT_VERSIONS;

/** Supported nested documentation block `formatVersion`. */
export const SUPPORTED_API_PACKAGE_DOCUMENTATION_FORMAT_VERSION =
  "1.0.0" as const;

/** Supported nested lifecycle block `formatVersion`. */
export const SUPPORTED_API_PACKAGE_LIFECYCLE_FORMAT_VERSION = "1.0.0" as const;

/**
 * Supported per-artifact body `formatVersion` values for families that declare
 * one in the published JSON. Families without a body `formatVersion` (OpenAPI
 * YAML, JSON Schema exports) are gated only via `familyFormatVersions`.
 */
export const SUPPORTED_API_PACKAGE_ARTIFACT_BODY_FORMAT_VERSIONS = {
  cli: "cli-command-identity/v1",
  mcp: "1",
  javascript: "1.0.0",
} as const satisfies Partial<Record<SupportedApiPackageFamily, string>>;

export type ApiPackageFormatVersionErrorCode =
  | "unsupported-manifest-format-version"
  | "unsupported-family-format-version"
  | "unsupported-documentation-format-version"
  | "unsupported-lifecycle-format-version"
  | "unsupported-artifact-format-version"
  | "missing-family-format-version"
  | "missing-artifact";

export class ApiPackageFormatVersionError extends Error {
  readonly code: ApiPackageFormatVersionErrorCode;
  readonly subpath?: string;
  readonly family?: string;
  readonly observedVersion?: string;
  readonly dependentReferenceFamily?: string;

  constructor(
    code: ApiPackageFormatVersionErrorCode,
    message: string,
    options: {
      subpath?: string;
      family?: string;
      observedVersion?: string;
      dependentReferenceFamily?: string;
      cause?: unknown;
    } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "ApiPackageFormatVersionError";
    this.code = code;
    this.subpath = options.subpath;
    this.family = options.family;
    this.observedVersion = options.observedVersion;
    this.dependentReferenceFamily = options.dependentReferenceFamily;
  }
}

export type ApiPackageFormatVersionCheckContext = {
  /** Documented public subpath being consumed. */
  subpath: string;
  /** Manifest export identity (for example `generated.cli.commands`). */
  exportId: string;
  /** Optional caller identity used in missing-artifact diagnostics. */
  dependentReferenceFamily?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unsupportedMessage(options: {
  kind: string;
  family?: string;
  subpath: string;
  exportId: string;
  observedVersion: string;
  supportedVersion: string;
}): string {
  const familyPart =
    options.family === undefined ? "" : ` family "${options.family}"`;
  return `Unsupported ${options.kind} format version "${options.observedVersion}" for @you-agent-factory/api/${options.subpath}${familyPart} (export "${options.exportId}"). The docs build does not support this version; supported version is "${options.supportedVersion}".`;
}

/**
 * Validate the publication manifest `formatVersion` against the docs-build
 * allowlist.
 */
export function assertSupportedApiPackageManifestFormatVersion(
  manifest: ApiPackageManifest,
  context: Pick<ApiPackageFormatVersionCheckContext, "subpath"> & {
    dependentReferenceFamily?: string;
  } = { subpath: "manifest" },
): void {
  if (
    manifest.formatVersion !== SUPPORTED_API_PACKAGE_MANIFEST_FORMAT_VERSION
  ) {
    throw new ApiPackageFormatVersionError(
      "unsupported-manifest-format-version",
      `Unsupported publication-manifest format version "${manifest.formatVersion}" for @you-agent-factory/api/${context.subpath}. The docs build does not support this version; supported version is "${SUPPORTED_API_PACKAGE_MANIFEST_FORMAT_VERSION}".`,
      {
        subpath: context.subpath,
        observedVersion: manifest.formatVersion,
        dependentReferenceFamily: context.dependentReferenceFamily,
      },
    );
  }
}

/**
 * Validate family / nested membership / optional artifact-body format versions
 * for one consumed export against the docs-build allowlist.
 */
export function assertSupportedApiPackageExportFormatVersions(options: {
  manifest: ApiPackageManifest;
  entry: ApiPackageManifestExportEntry;
  artifactData: unknown;
  context: ApiPackageFormatVersionCheckContext;
}): void {
  const { manifest, entry, artifactData, context } = options;
  const { subpath, exportId, dependentReferenceFamily } = context;
  const family = entry.family;

  assertSupportedApiPackageManifestFormatVersion(manifest, {
    subpath,
    dependentReferenceFamily,
  });

  const publishedFamilyVersion = manifest.familyFormatVersions[family];
  if (
    publishedFamilyVersion === undefined ||
    publishedFamilyVersion.length === 0
  ) {
    throw new ApiPackageFormatVersionError(
      "missing-family-format-version",
      `Missing family format version for artifact family "${family}" consumed via @you-agent-factory/api/${subpath} (export "${exportId}"). The published package manifest does not record familyFormatVersions["${family}"].`,
      {
        subpath,
        family,
        dependentReferenceFamily,
      },
    );
  }

  const supportedFamilyVersion =
    SUPPORTED_API_PACKAGE_FAMILY_FORMAT_VERSIONS[
      family as SupportedApiPackageFamily
    ];
  if (supportedFamilyVersion === undefined) {
    throw new ApiPackageFormatVersionError(
      "unsupported-family-format-version",
      `Unsupported artifact family "${family}" for @you-agent-factory/api/${subpath} (export "${exportId}") with published family format version "${publishedFamilyVersion}". The docs build does not support this family/version.`,
      {
        subpath,
        family,
        observedVersion: publishedFamilyVersion,
        dependentReferenceFamily,
      },
    );
  }

  if (publishedFamilyVersion !== supportedFamilyVersion) {
    throw new ApiPackageFormatVersionError(
      "unsupported-family-format-version",
      unsupportedMessage({
        kind: "family",
        family,
        subpath,
        exportId,
        observedVersion: publishedFamilyVersion,
        supportedVersion: supportedFamilyVersion,
      }),
      {
        subpath,
        family,
        observedVersion: publishedFamilyVersion,
        dependentReferenceFamily,
      },
    );
  }

  if (
    entry.documentation.formatVersion !==
    SUPPORTED_API_PACKAGE_DOCUMENTATION_FORMAT_VERSION
  ) {
    throw new ApiPackageFormatVersionError(
      "unsupported-documentation-format-version",
      unsupportedMessage({
        kind: "documentation",
        family,
        subpath,
        exportId,
        observedVersion: entry.documentation.formatVersion,
        supportedVersion: SUPPORTED_API_PACKAGE_DOCUMENTATION_FORMAT_VERSION,
      }),
      {
        subpath,
        family,
        observedVersion: entry.documentation.formatVersion,
        dependentReferenceFamily,
      },
    );
  }

  if (
    entry.lifecycle.formatVersion !==
    SUPPORTED_API_PACKAGE_LIFECYCLE_FORMAT_VERSION
  ) {
    throw new ApiPackageFormatVersionError(
      "unsupported-lifecycle-format-version",
      unsupportedMessage({
        kind: "lifecycle",
        family,
        subpath,
        exportId,
        observedVersion: entry.lifecycle.formatVersion,
        supportedVersion: SUPPORTED_API_PACKAGE_LIFECYCLE_FORMAT_VERSION,
      }),
      {
        subpath,
        family,
        observedVersion: entry.lifecycle.formatVersion,
        dependentReferenceFamily,
      },
    );
  }

  const supportedBodyVersion =
    SUPPORTED_API_PACKAGE_ARTIFACT_BODY_FORMAT_VERSIONS[
      family as keyof typeof SUPPORTED_API_PACKAGE_ARTIFACT_BODY_FORMAT_VERSIONS
    ];
  if (supportedBodyVersion === undefined) {
    return;
  }

  if (!isPlainObject(artifactData)) {
    throw new ApiPackageFormatVersionError(
      "unsupported-artifact-format-version",
      `Missing artifact formatVersion for family "${family}" consumed via @you-agent-factory/api/${subpath} (export "${exportId}"). The docs build expects format version "${supportedBodyVersion}" but the artifact body is not an object.`,
      {
        subpath,
        family,
        dependentReferenceFamily,
      },
    );
  }

  const observedBodyVersion = artifactData.formatVersion;
  if (
    typeof observedBodyVersion !== "string" ||
    observedBodyVersion.length === 0
  ) {
    throw new ApiPackageFormatVersionError(
      "unsupported-artifact-format-version",
      `Missing artifact formatVersion for family "${family}" consumed via @you-agent-factory/api/${subpath} (export "${exportId}"). The docs build expects format version "${supportedBodyVersion}".`,
      {
        subpath,
        family,
        dependentReferenceFamily,
      },
    );
  }

  if (observedBodyVersion !== supportedBodyVersion) {
    throw new ApiPackageFormatVersionError(
      "unsupported-artifact-format-version",
      unsupportedMessage({
        kind: "artifact",
        family,
        subpath,
        exportId,
        observedVersion: observedBodyVersion,
        supportedVersion: supportedBodyVersion,
      }),
      {
        subpath,
        family,
        observedVersion: observedBodyVersion,
        dependentReferenceFamily,
      },
    );
  }
}

/**
 * Build an actionable missing-artifact diagnostic that names the public
 * subpath and the dependent reference family (caller consumer identity).
 */
export function missingRequiredApiPackageArtifactMessage(options: {
  subpath: string;
  dependentReferenceFamily: string;
  detail?: string;
}): string {
  const detail =
    options.detail === undefined || options.detail.length === 0
      ? ""
      : ` ${options.detail}`;
  return `Missing required @you-agent-factory/api artifact for public subpath "${options.subpath}" required by dependent reference family "${options.dependentReferenceFamily}".${detail}`;
}
