/**
 * Resolve the packaged `@you-agent-factory/api` OpenAPI artifact for the W02
 * spike. Returns the absolute filesystem path only — never rewrites, filters,
 * or strips SSE operations / `x-event-schema` extensions.
 *
 * Build/server-only. Do not import from client components.
 *
 * Uses filesystem lookup under `node_modules/@you-agent-factory/api` (verifying
 * the package `exports["./openapi"]` target). Do not `require.resolve` /
 * `import` the YAML export in Next/Turbopack — the MDX toolchain will try to
 * parse YAML as JavaScript.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { SSE_SPIKE_OPENAPI_EXPORT } from "./sse-operations";

/** Relative path published by `@you-agent-factory/api` `exports["./openapi"]`. */
export const SSE_SPIKE_OPENAPI_PACKAGE_RELATIVE_PATH =
  "generated/openapi/openapi.yaml" as const;

export const SSE_SPIKE_API_PACKAGE_NAME = "@you-agent-factory/api" as const;

export type PackagedOpenApiArtifact = {
  /** Canonical package export specifier. */
  specifier: typeof SSE_SPIKE_OPENAPI_EXPORT;
  /** Absolute filesystem path of the packaged YAML. */
  absolutePath: string;
  /** Exact UTF-8 bytes from the packaged artifact (unmodified). */
  rawText: string;
};

export type ResolvePackagedOpenApiDependencies = {
  /**
   * Resolve a package export specifier to an absolute filesystem path.
   * Defaults to installed-package filesystem lookup.
   */
  resolveExportPath?: (specifier: string) => string;
  readTextFile?: (absolutePath: string) => string;
  /** Override project root (defaults to `process.cwd()`). */
  projectRoot?: string;
};

type ApiPackageJson = {
  name?: string;
  exports?: Record<string, string>;
};

function resolveInstalledApiPackageRoot(projectRoot: string): string {
  const packageJsonPath = join(
    projectRoot,
    "node_modules",
    SSE_SPIKE_API_PACKAGE_NAME,
    "package.json",
  );
  if (!existsSync(packageJsonPath)) {
    throw new Error(
      `Installed ${SSE_SPIKE_API_PACKAGE_NAME} package.json not found at ${packageJsonPath}. Run bun install.`,
    );
  }

  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf8"),
  ) as ApiPackageJson;
  if (packageJson.name !== SSE_SPIKE_API_PACKAGE_NAME) {
    throw new Error(
      `Expected package name ${SSE_SPIKE_API_PACKAGE_NAME}, found ${String(packageJson.name)}.`,
    );
  }

  const openapiExport = packageJson.exports?.["./openapi"];
  if (openapiExport !== `./${SSE_SPIKE_OPENAPI_PACKAGE_RELATIVE_PATH}`) {
    throw new Error(
      `${SSE_SPIKE_API_PACKAGE_NAME} exports["./openapi"] is ${JSON.stringify(openapiExport)}; expected "./${SSE_SPIKE_OPENAPI_PACKAGE_RELATIVE_PATH}".`,
    );
  }

  return dirname(packageJsonPath);
}

function defaultResolveExportPath(
  specifier: string,
  projectRoot: string,
): string {
  if (specifier !== SSE_SPIKE_OPENAPI_EXPORT) {
    throw new Error(
      `SSE spike OpenAPI resolver only accepts "${SSE_SPIKE_OPENAPI_EXPORT}", got "${specifier}".`,
    );
  }

  const packageRoot = resolveInstalledApiPackageRoot(projectRoot);
  const absolutePath = join(
    packageRoot,
    SSE_SPIKE_OPENAPI_PACKAGE_RELATIVE_PATH,
  );
  if (!existsSync(absolutePath)) {
    throw new Error(
      `Packaged OpenAPI artifact missing at ${absolutePath} (from ${SSE_SPIKE_OPENAPI_EXPORT}).`,
    );
  }
  return absolutePath;
}

function defaultReadTextFile(absolutePath: string): string {
  return readFileSync(absolutePath, "utf8");
}

/**
 * Resolve and read the published OpenAPI YAML without transforming it.
 */
export function loadPackagedOpenApiArtifact(
  deps: ResolvePackagedOpenApiDependencies = {},
): PackagedOpenApiArtifact {
  const projectRoot = deps.projectRoot ?? process.cwd();
  const resolveExportPath =
    deps.resolveExportPath ??
    ((specifier: string) => defaultResolveExportPath(specifier, projectRoot));
  const readTextFile = deps.readTextFile ?? defaultReadTextFile;

  const absolutePath = resolveExportPath(SSE_SPIKE_OPENAPI_EXPORT);
  const rawText = readTextFile(absolutePath);

  return {
    specifier: SSE_SPIKE_OPENAPI_EXPORT,
    absolutePath,
    rawText,
  };
}

/**
 * Absolute path suitable for `createOpenAPI({ input })`. Prefer this over
 * copying YAML into the repo — the packaged artifact remains the sole input.
 */
export function resolvePackagedOpenApiAbsolutePath(
  deps: Pick<
    ResolvePackagedOpenApiDependencies,
    "resolveExportPath" | "projectRoot"
  > = {},
): string {
  return loadPackagedOpenApiArtifact(deps).absolutePath;
}

/** `file://` URL form of the packaged OpenAPI path (diagnostics / logging). */
export function resolvePackagedOpenApiFileUrl(
  deps: Pick<
    ResolvePackagedOpenApiDependencies,
    "resolveExportPath" | "projectRoot"
  > = {},
): string {
  return pathToFileURL(resolvePackagedOpenApiAbsolutePath(deps)).href;
}
