/**
 * Build/server-only resolver for published `@you-agent-factory/api` public
 * subpath artifacts.
 *
 * Resolves documented package export map entries via Node package resolution
 * (createRequire / require.resolve). Does not hardcode node_modules paths and
 * rejects package-root and package-internal locators before resolution.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Installed package id for the Factory contract artifact publication. */
export const YOU_AGENT_FACTORY_API_PACKAGE = "@you-agent-factory/api" as const;

/**
 * Documented public subpaths consumed by the docs reference bootstrap.
 * Keep aligned with `@you-agent-factory/api` package `exports` (excluding
 * `joined/*`, which is not part of this bootstrap allowlist).
 */
export const YOU_AGENT_FACTORY_API_PUBLIC_SUBPATHS = [
  "manifest",
  "openapi",
  "cli",
  "mcp",
  "schemas/factory",
  "schemas/you-config",
  "schemas/mock-workers",
  "javascript/runtime",
] as const;

export type YouAgentFactoryApiPublicSubpath =
  (typeof YOU_AGENT_FACTORY_API_PUBLIC_SUBPATHS)[number];

const PUBLIC_SUBPATH_SET = new Set<string>(
  YOU_AGENT_FACTORY_API_PUBLIC_SUBPATHS,
);

export function isYouAgentFactoryApiPublicSubpath(
  subpath: string,
): subpath is YouAgentFactoryApiPublicSubpath {
  return PUBLIC_SUBPATH_SET.has(subpath);
}

export function toYouAgentFactoryApiExportSpecifier(
  subpath: YouAgentFactoryApiPublicSubpath,
): string {
  return `${YOU_AGENT_FACTORY_API_PACKAGE}/${subpath}`;
}

export class YouAgentFactoryApiArtifactResolutionError extends Error {
  readonly subpath: string;
  readonly reason: "package-root" | "non-public" | "resolution-failed";

  constructor(
    message: string,
    options: {
      subpath: string;
      reason: YouAgentFactoryApiArtifactResolutionError["reason"];
      cause?: unknown;
    },
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "YouAgentFactoryApiArtifactResolutionError";
    this.subpath = options.subpath;
    this.reason = options.reason;
  }
}

function normalizeRequestedSubpath(subpath: string): string {
  return subpath.trim().replace(/^\/+/, "").replace(/\\/g, "/");
}

function isPackageRootRequest(subpath: string): boolean {
  return (
    subpath === "" ||
    subpath === "." ||
    subpath === YOU_AGENT_FACTORY_API_PACKAGE ||
    subpath === `${YOU_AGENT_FACTORY_API_PACKAGE}/`
  );
}

function isPackageInternalRequest(subpath: string): boolean {
  return (
    subpath === "package.json" ||
    subpath.startsWith("generated/") ||
    subpath.includes("/generated/") ||
    subpath.startsWith("node_modules/") ||
    subpath.includes("..")
  );
}

function assertPublicSubpath(
  rawSubpath: string,
): YouAgentFactoryApiPublicSubpath {
  const subpath = normalizeRequestedSubpath(rawSubpath);

  if (isPackageRootRequest(subpath)) {
    throw new YouAgentFactoryApiArtifactResolutionError(
      `Refusing to resolve the @you-agent-factory/api package root. Use a documented public subpath such as ${YOU_AGENT_FACTORY_API_PUBLIC_SUBPATHS.map((entry) => `"${entry}"`).join(", ")}.`,
      { subpath: rawSubpath, reason: "package-root" },
    );
  }

  if (
    isPackageInternalRequest(subpath) ||
    !isYouAgentFactoryApiPublicSubpath(subpath)
  ) {
    const allowed = YOU_AGENT_FACTORY_API_PUBLIC_SUBPATHS.join(", ");
    throw new YouAgentFactoryApiArtifactResolutionError(
      `Refusing non-public @you-agent-factory/api locator "${rawSubpath}". Allowed public subpaths: ${allowed}. Do not resolve package-internal paths such as generated/* or package.json.`,
      { subpath: rawSubpath, reason: "non-public" },
    );
  }

  return subpath;
}

/**
 * Resolve a documented public subpath to an absolute filesystem path via the
 * installed package export map.
 */
export function resolveYouAgentFactoryApiArtifactPath(
  rawSubpath: string,
): string {
  const subpath = assertPublicSubpath(rawSubpath);
  const specifier = toYouAgentFactoryApiExportSpecifier(subpath);

  try {
    return require.resolve(specifier);
  } catch (cause) {
    throw new YouAgentFactoryApiArtifactResolutionError(
      `Failed to resolve public @you-agent-factory/api subpath "${subpath}" (${specifier}). Ensure the package is installed and the export map still publishes this subpath.`,
      { subpath, reason: "resolution-failed", cause },
    );
  }
}

/**
 * Load a documented public subpath artifact as UTF-8 text after resolving it
 * through the package export map.
 */
export function loadYouAgentFactoryApiArtifact(rawSubpath: string): string {
  const absolutePath = resolveYouAgentFactoryApiArtifactPath(rawSubpath);
  return readFileSync(absolutePath, "utf8");
}
