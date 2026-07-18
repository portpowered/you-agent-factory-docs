/**
 * Pure types and shape checks for the `@you-agent-factory/api` publication
 * manifest. No filesystem or package-resolution IO — callers load the
 * published JSON through the public-subpath resolver and pass it here.
 */

const SHA256_HEX = /^[0-9a-f]{64}$/;
const ITEM_ID = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const SEMVER = /^(0|[1-9][0-9]*)[.](0|[1-9][0-9]*)[.](0|[1-9][0-9]*)$/;

export type ApiPackageManifestDocumentationBlock = {
  title: { id: string; canonicalEnglish: string };
  description: { id: string; canonicalEnglish: string };
};

export type ApiPackageManifestDocumentation = {
  formatVersion: string;
  itemId: string;
  documentation: ApiPackageManifestDocumentationBlock;
  examples: unknown[];
  visibility: "public" | "internal";
  sourceHash: string;
};

export type ApiPackageManifestLifecycle = {
  formatVersion: string;
  itemId: string;
  since: string;
  state: "active" | "deprecated" | "removed";
  deprecated?: string;
  removed?: string;
  successor?: { targetItemId: string; canonicalEnglish: string };
};

export type ApiPackageManifestExportEntry = {
  path: string;
  family: string;
  artifactHash: string;
  documentation: ApiPackageManifestDocumentation;
  lifecycle: ApiPackageManifestLifecycle;
};

export type ApiPackageManifest = {
  formatVersion: string;
  packageId: string;
  packageVersion: string;
  sourceCommit: string;
  familyFormatVersions: Record<string, string>;
  exports: Record<string, ApiPackageManifestExportEntry>;
};

export type ApiPackageManifestParseErrorCode =
  | "malformed-manifest"
  | "malformed-membership";

export class ApiPackageManifestParseError extends Error {
  readonly code: ApiPackageManifestParseErrorCode;
  readonly exportId?: string;
  readonly field?: string;

  constructor(
    code: ApiPackageManifestParseErrorCode,
    message: string,
    options: { exportId?: string; field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "ApiPackageManifestParseError";
    this.code = code;
    this.exportId = options.exportId;
    this.field = options.field;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(
  value: unknown,
  field: string,
  context: { exportId?: string; code: ApiPackageManifestParseErrorCode },
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ApiPackageManifestParseError(
      context.code,
      context.exportId === undefined
        ? `Malformed @you-agent-factory/api manifest: field "${field}" must be a non-empty string.`
        : `Malformed @you-agent-factory/api manifest membership for export "${context.exportId}": field "${field}" must be a non-empty string.`,
      { exportId: context.exportId, field },
    );
  }
  return value;
}

function requirePattern(
  value: string,
  pattern: RegExp,
  field: string,
  context: { exportId?: string; code: ApiPackageManifestParseErrorCode },
): string {
  if (!pattern.test(value)) {
    throw new ApiPackageManifestParseError(
      context.code,
      context.exportId === undefined
        ? `Malformed @you-agent-factory/api manifest: field "${field}" has unexpected shape.`
        : `Malformed @you-agent-factory/api manifest membership for export "${context.exportId}": field "${field}" has unexpected shape.`,
      { exportId: context.exportId, field },
    );
  }
  return value;
}

function parseLocalizedText(
  value: unknown,
  field: string,
  exportId: string,
): { id: string; canonicalEnglish: string } {
  if (!isPlainObject(value)) {
    throw new ApiPackageManifestParseError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": field "${field}" must be an object.`,
      { exportId, field },
    );
  }

  return {
    id: requireNonEmptyString(value.id, `${field}.id`, {
      exportId,
      code: "malformed-membership",
    }),
    canonicalEnglish: requireNonEmptyString(
      value.canonicalEnglish,
      `${field}.canonicalEnglish`,
      { exportId, code: "malformed-membership" },
    ),
  };
}

function parseDocumentation(
  value: unknown,
  exportId: string,
): ApiPackageManifestDocumentation {
  if (!isPlainObject(value)) {
    throw new ApiPackageManifestParseError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": field "documentation" must be an object.`,
      { exportId, field: "documentation" },
    );
  }

  const formatVersion = requireNonEmptyString(
    value.formatVersion,
    "documentation.formatVersion",
    {
      exportId,
      code: "malformed-membership",
    },
  );
  const itemId = requirePattern(
    requireNonEmptyString(value.itemId, "documentation.itemId", {
      exportId,
      code: "malformed-membership",
    }),
    ITEM_ID,
    "documentation.itemId",
    { exportId, code: "malformed-membership" },
  );

  if (!isPlainObject(value.documentation)) {
    throw new ApiPackageManifestParseError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": field "documentation.documentation" must be an object.`,
      { exportId, field: "documentation.documentation" },
    );
  }

  if (!Array.isArray(value.examples) || value.examples.length === 0) {
    throw new ApiPackageManifestParseError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": field "documentation.examples" must be a non-empty array.`,
      { exportId, field: "documentation.examples" },
    );
  }

  const visibility = requireNonEmptyString(
    value.visibility,
    "documentation.visibility",
    { exportId, code: "malformed-membership" },
  );
  if (visibility !== "public" && visibility !== "internal") {
    throw new ApiPackageManifestParseError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": field "documentation.visibility" must be "public" or "internal".`,
      { exportId, field: "documentation.visibility" },
    );
  }

  const sourceHash = requirePattern(
    requireNonEmptyString(value.sourceHash, "documentation.sourceHash", {
      exportId,
      code: "malformed-membership",
    }),
    SHA256_HEX,
    "documentation.sourceHash",
    { exportId, code: "malformed-membership" },
  );

  return {
    formatVersion,
    itemId,
    documentation: {
      title: parseLocalizedText(
        value.documentation.title,
        "documentation.documentation.title",
        exportId,
      ),
      description: parseLocalizedText(
        value.documentation.description,
        "documentation.documentation.description",
        exportId,
      ),
    },
    examples: value.examples,
    visibility,
    sourceHash,
  };
}

function parseLifecycle(
  value: unknown,
  exportId: string,
): ApiPackageManifestLifecycle {
  if (!isPlainObject(value)) {
    throw new ApiPackageManifestParseError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": field "lifecycle" must be an object.`,
      { exportId, field: "lifecycle" },
    );
  }

  const formatVersion = requireNonEmptyString(
    value.formatVersion,
    "lifecycle.formatVersion",
    {
      exportId,
      code: "malformed-membership",
    },
  );
  const itemId = requirePattern(
    requireNonEmptyString(value.itemId, "lifecycle.itemId", {
      exportId,
      code: "malformed-membership",
    }),
    ITEM_ID,
    "lifecycle.itemId",
    { exportId, code: "malformed-membership" },
  );
  const since = requirePattern(
    requireNonEmptyString(value.since, "lifecycle.since", {
      exportId,
      code: "malformed-membership",
    }),
    SEMVER,
    "lifecycle.since",
    { exportId, code: "malformed-membership" },
  );
  const state = requireNonEmptyString(value.state, "lifecycle.state", {
    exportId,
    code: "malformed-membership",
  });
  if (state !== "active" && state !== "deprecated" && state !== "removed") {
    throw new ApiPackageManifestParseError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": field "lifecycle.state" must be "active", "deprecated", or "removed".`,
      { exportId, field: "lifecycle.state" },
    );
  }

  const lifecycle: ApiPackageManifestLifecycle = {
    formatVersion,
    itemId,
    since,
    state,
  };

  if (value.deprecated !== undefined) {
    lifecycle.deprecated = requirePattern(
      requireNonEmptyString(value.deprecated, "lifecycle.deprecated", {
        exportId,
        code: "malformed-membership",
      }),
      SEMVER,
      "lifecycle.deprecated",
      { exportId, code: "malformed-membership" },
    );
  }

  if (value.removed !== undefined) {
    lifecycle.removed = requirePattern(
      requireNonEmptyString(value.removed, "lifecycle.removed", {
        exportId,
        code: "malformed-membership",
      }),
      SEMVER,
      "lifecycle.removed",
      { exportId, code: "malformed-membership" },
    );
  }

  if (value.successor !== undefined) {
    if (!isPlainObject(value.successor)) {
      throw new ApiPackageManifestParseError(
        "malformed-membership",
        `Malformed @you-agent-factory/api manifest membership for export "${exportId}": field "lifecycle.successor" must be an object.`,
        { exportId, field: "lifecycle.successor" },
      );
    }
    lifecycle.successor = {
      targetItemId: requirePattern(
        requireNonEmptyString(
          value.successor.targetItemId,
          "lifecycle.successor.targetItemId",
          { exportId, code: "malformed-membership" },
        ),
        ITEM_ID,
        "lifecycle.successor.targetItemId",
        { exportId, code: "malformed-membership" },
      ),
      canonicalEnglish: requireNonEmptyString(
        value.successor.canonicalEnglish,
        "lifecycle.successor.canonicalEnglish",
        { exportId, code: "malformed-membership" },
      ),
    };
  }

  return lifecycle;
}

/**
 * Parse and validate one published manifest export entry shape.
 * Does not invent missing fields — fails closed when membership metadata is malformed.
 */
export function parseApiPackageManifestExportEntry(
  exportId: string,
  value: unknown,
): ApiPackageManifestExportEntry {
  if (!isPlainObject(value)) {
    throw new ApiPackageManifestParseError(
      "malformed-membership",
      `Malformed @you-agent-factory/api manifest membership for export "${exportId}": entry must be an object.`,
      { exportId },
    );
  }

  const path = requireNonEmptyString(value.path, "path", {
    exportId,
    code: "malformed-membership",
  });
  const family = requirePattern(
    requireNonEmptyString(value.family, "family", {
      exportId,
      code: "malformed-membership",
    }),
    ITEM_ID,
    "family",
    { exportId, code: "malformed-membership" },
  );
  const artifactHash = requirePattern(
    requireNonEmptyString(value.artifactHash, "artifactHash", {
      exportId,
      code: "malformed-membership",
    }),
    SHA256_HEX,
    "artifactHash",
    { exportId, code: "malformed-membership" },
  );

  return {
    path,
    family,
    artifactHash,
    documentation: parseDocumentation(value.documentation, exportId),
    lifecycle: parseLifecycle(value.lifecycle, exportId),
  };
}

/**
 * Parse the published package manifest JSON into a typed membership authority.
 * Reads only the published shape; does not patch or invent export entries.
 */
export function parseApiPackageManifest(data: unknown): ApiPackageManifest {
  if (!isPlainObject(data)) {
    throw new ApiPackageManifestParseError(
      "malformed-manifest",
      "Malformed @you-agent-factory/api manifest: expected a JSON object.",
    );
  }

  const formatVersion = requireNonEmptyString(
    data.formatVersion,
    "formatVersion",
    {
      code: "malformed-manifest",
    },
  );
  const packageId = requireNonEmptyString(data.packageId, "packageId", {
    code: "malformed-manifest",
  });
  const packageVersion = requireNonEmptyString(
    data.packageVersion,
    "packageVersion",
    {
      code: "malformed-manifest",
    },
  );
  const sourceCommit = requireNonEmptyString(
    data.sourceCommit,
    "sourceCommit",
    {
      code: "malformed-manifest",
    },
  );

  if (!isPlainObject(data.familyFormatVersions)) {
    throw new ApiPackageManifestParseError(
      "malformed-manifest",
      'Malformed @you-agent-factory/api manifest: field "familyFormatVersions" must be an object.',
      { field: "familyFormatVersions" },
    );
  }

  const familyFormatVersions: Record<string, string> = {};
  for (const [family, version] of Object.entries(data.familyFormatVersions)) {
    familyFormatVersions[family] = requireNonEmptyString(
      version,
      `familyFormatVersions.${family}`,
      { code: "malformed-manifest" },
    );
  }

  if (!isPlainObject(data.exports)) {
    throw new ApiPackageManifestParseError(
      "malformed-manifest",
      'Malformed @you-agent-factory/api manifest: field "exports" must be an object.',
      { field: "exports" },
    );
  }

  const exports: Record<string, ApiPackageManifestExportEntry> = {};
  for (const [exportId, entry] of Object.entries(data.exports)) {
    exports[exportId] = parseApiPackageManifestExportEntry(exportId, entry);
  }

  return {
    formatVersion,
    packageId,
    packageVersion,
    sourceCommit,
    familyFormatVersions,
    exports,
  };
}

/**
 * Index validated manifest exports by their published package-relative `path`.
 */
export function indexApiPackageManifestExportsByPath(
  manifest: ApiPackageManifest,
): Map<string, { exportId: string; entry: ApiPackageManifestExportEntry }> {
  const index = new Map<
    string,
    { exportId: string; entry: ApiPackageManifestExportEntry }
  >();

  for (const [exportId, entry] of Object.entries(manifest.exports)) {
    index.set(entry.path, { exportId, entry });
  }

  return index;
}

/**
 * Derive the package-relative artifact path (`generated/...`) from a resolved
 * absolute filesystem path under the installed `@you-agent-factory/api` package.
 */
export function packageRelativePathFromResolvedArtifactPath(
  resolvedPath: string,
): string | null {
  const marker = "/@you-agent-factory/api/";
  const index = resolvedPath.lastIndexOf(marker);
  if (index === -1) {
    return null;
  }

  const relative = resolvedPath.slice(index + marker.length);
  return relative.length > 0 ? relative : null;
}
