/**
 * Build/server-only resolver for `@you-agent-factory/api` public export artifacts.
 *
 * Loads JSON and YAML only through documented public subpaths via package export
 * resolution (`import.meta.resolve`). Rejects package-root imports, package-internal
 * `generated/...` targets, and raw filesystem paths under the package tree.
 *
 * Do not import this module from client/browser UI code — it depends on Node
 * filesystem APIs and package resolution.
 */

import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  API_PACKAGE_NAME,
  isDocumentedApiPackagePublicSubpath,
  parseApiPackageExportTarget,
  toApiPackageExportSpecifier,
} from "./api-package-public-exports";

export type ApiPackageArtifactFormat = "json" | "yaml";

export type ResolvedApiPackageArtifact = {
  /** Documented public subpath (for example `manifest` or `openapi`). */
  subpath: string;
  /** Canonical package export specifier. */
  specifier: string;
  /** Resolved `file:` URL from package export resolution. */
  resolvedUrl: string;
  /** Absolute filesystem path of the resolved artifact. */
  resolvedPath: string;
  format: ApiPackageArtifactFormat;
  /** Parsed structured data (JSON object/array or YAML document). */
  data: unknown;
  /** Exact file bytes decoded as UTF-8. */
  rawText: string;
};

export type ApiPackageArtifactResolutionErrorCode =
  | "illegal-target"
  | "missing-export"
  | "parse-failed";

export class ApiPackageArtifactResolutionError extends Error {
  readonly code: ApiPackageArtifactResolutionErrorCode;
  readonly target: string;
  readonly subpath?: string;

  constructor(
    code: ApiPackageArtifactResolutionErrorCode,
    message: string,
    options: { target: string; subpath?: string; cause?: unknown },
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "ApiPackageArtifactResolutionError";
    this.code = code;
    this.target = options.target;
    this.subpath = options.subpath;
  }
}

export type ApiPackageArtifactResolverDependencies = {
  /**
   * Resolve a package export specifier to a `file:` URL string.
   * Defaults to `import.meta.resolve`.
   */
  resolveExport?: (specifier: string) => string;
  /**
   * Read UTF-8 file contents from an absolute path.
   * Defaults to `readFileSync`.
   */
  readTextFile?: (absolutePath: string) => string;
  /**
   * Parse YAML text into structured data.
   * Defaults to `Bun.YAML.parse`.
   */
  parseYaml?: (text: string) => unknown;
};

function defaultResolveExport(specifier: string): string {
  return import.meta.resolve(specifier);
}

function defaultReadTextFile(absolutePath: string): string {
  return readFileSync(absolutePath, "utf8");
}

function defaultParseYaml(text: string): unknown {
  return Bun.YAML.parse(text);
}

function formatFromPath(resolvedPath: string): ApiPackageArtifactFormat {
  const extension = extname(resolvedPath).toLowerCase();
  if (extension === ".json") {
    return "json";
  }
  if (extension === ".yaml" || extension === ".yml") {
    return "yaml";
  }

  throw new ApiPackageArtifactResolutionError(
    "parse-failed",
    `Resolved @you-agent-factory/api artifact at "${resolvedPath}" has unsupported extension "${extension || "(none)"}". Expected .json, .yaml, or .yml.`,
    { target: resolvedPath },
  );
}

function isPackageInternalSubpath(subpath: string): boolean {
  return (
    subpath === "generated" ||
    subpath.startsWith("generated/") ||
    subpath.includes("/generated/")
  );
}

function classifyTarget(target: string): {
  kind: "public" | "illegal" | "missing";
  subpath?: string;
  specifier?: string;
  message: string;
} {
  const parsed = parseApiPackageExportTarget(target);

  if (parsed === null) {
    return {
      kind: "illegal",
      message: `Illegal @you-agent-factory/api artifact target "${target}". Resolve artifacts only through documented public package exports (for example @you-agent-factory/api/manifest); package-root imports, package-internal paths, and raw filesystem paths are rejected.`,
    };
  }

  if (parsed.packageName !== API_PACKAGE_NAME) {
    return {
      kind: "illegal",
      message: `Illegal package artifact target "${target}". Only ${API_PACKAGE_NAME} public exports are supported.`,
    };
  }

  if (parsed.subpath.length === 0) {
    return {
      kind: "illegal",
      subpath: "",
      message: `Illegal @you-agent-factory/api package-root target "${target}". Import a documented public subpath such as @you-agent-factory/api/manifest instead of the package root.`,
    };
  }

  if (isPackageInternalSubpath(parsed.subpath)) {
    return {
      kind: "illegal",
      subpath: parsed.subpath,
      message: `Illegal package-internal @you-agent-factory/api target "${target}". Package-internal paths such as @you-agent-factory/api/generated/... are rejected; use a documented public subpath export instead.`,
    };
  }

  if (!isDocumentedApiPackagePublicSubpath(parsed.subpath)) {
    return {
      kind: "missing",
      subpath: parsed.subpath,
      specifier: toApiPackageExportSpecifier(parsed.subpath),
      message: `Missing @you-agent-factory/api public export for requested subpath "${parsed.subpath}". "${toApiPackageExportSpecifier(parsed.subpath)}" is not a documented public package export.`,
    };
  }

  return {
    kind: "public",
    subpath: parsed.subpath,
    specifier: toApiPackageExportSpecifier(parsed.subpath),
    message: "",
  };
}

function parseArtifactText(
  format: ApiPackageArtifactFormat,
  rawText: string,
  options: {
    target: string;
    subpath: string;
    resolvedPath: string;
    parseYaml: (text: string) => unknown;
  },
): unknown {
  try {
    if (format === "json") {
      return JSON.parse(rawText) as unknown;
    }
    return options.parseYaml(rawText);
  } catch (cause) {
    throw new ApiPackageArtifactResolutionError(
      "parse-failed",
      `Failed to parse ${format.toUpperCase()} artifact for @you-agent-factory/api/${options.subpath} at "${options.resolvedPath}".`,
      { target: options.target, subpath: options.subpath, cause },
    );
  }
}

/**
 * Resolve and parse a documented `@you-agent-factory/api` public export.
 *
 * Accepts a full specifier (`@you-agent-factory/api/manifest`) or a bare
 * documented subpath (`manifest`). Rejects package root, package-internal
 * targets, and filesystem paths with actionable errors.
 */
export function resolveApiPackageArtifact(
  target: string,
  dependencies: ApiPackageArtifactResolverDependencies = {},
): ResolvedApiPackageArtifact {
  const classification = classifyTarget(target);
  if (classification.kind === "illegal") {
    throw new ApiPackageArtifactResolutionError(
      "illegal-target",
      classification.message,
      {
        target,
        subpath: classification.subpath,
      },
    );
  }

  if (classification.kind === "missing") {
    throw new ApiPackageArtifactResolutionError(
      "missing-export",
      classification.message,
      {
        target,
        subpath: classification.subpath,
      },
    );
  }

  const subpath = classification.subpath;
  const specifier = classification.specifier;
  if (subpath === undefined || specifier === undefined) {
    throw new ApiPackageArtifactResolutionError(
      "illegal-target",
      `Illegal @you-agent-factory/api artifact target "${target}".`,
      { target },
    );
  }

  const resolveExport = dependencies.resolveExport ?? defaultResolveExport;
  const readTextFile = dependencies.readTextFile ?? defaultReadTextFile;
  const parseYaml = dependencies.parseYaml ?? defaultParseYaml;

  let resolvedUrl: string;
  try {
    resolvedUrl = resolveExport(specifier);
  } catch (cause) {
    throw new ApiPackageArtifactResolutionError(
      "missing-export",
      `Missing @you-agent-factory/api public export for requested subpath "${subpath}". Package export resolution failed for "${specifier}".`,
      { target, subpath, cause },
    );
  }

  let resolvedPath: string;
  try {
    resolvedPath = fileURLToPath(resolvedUrl);
  } catch (cause) {
    throw new ApiPackageArtifactResolutionError(
      "missing-export",
      `Missing @you-agent-factory/api public export for requested subpath "${subpath}". Resolved URL "${resolvedUrl}" is not a readable file URL.`,
      { target, subpath, cause },
    );
  }

  let rawText: string;
  try {
    rawText = readTextFile(resolvedPath);
  } catch (cause) {
    throw new ApiPackageArtifactResolutionError(
      "missing-export",
      `Missing @you-agent-factory/api public export for requested subpath "${subpath}". Resolved file "${resolvedPath}" could not be read.`,
      { target, subpath, cause },
    );
  }

  const format = formatFromPath(resolvedPath);
  const data = parseArtifactText(format, rawText, {
    target,
    subpath,
    resolvedPath,
    parseYaml,
  });

  return {
    subpath,
    specifier,
    resolvedUrl,
    resolvedPath,
    format,
    data,
    rawText,
  };
}
