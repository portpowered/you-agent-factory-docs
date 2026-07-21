/**
 * Build/server helper: resolve `@you-agent-factory/api/javascript/runtime`
 * through W03 and normalize into a W10 `JavaScriptRuntimeInventory` input for
 * the published JavaScript runtime reference page.
 *
 * Do not import from client/browser UI bundles — depends on Node package
 * resolution via `resolveApiPackageArtifact`.
 */

import type { JavaScriptRuntimeInventoryInput } from "@/features/references/javascript";
import {
  ApiPackageArtifactResolutionError,
  type ApiPackageArtifactResolverDependencies,
  resolveApiPackageArtifact,
} from "./api-package-artifact-resolver";
import {
  JAVASCRIPT_RUNTIME_REFERENCE_PUBLIC_SUBPATH,
  javascriptRuntimeReferenceTurbopackLoadDependencies,
} from "./javascript-runtime-reference-turbopack";
import {
  FamilyArtifactNormalizeError,
  normalizeJavascriptSharedSchemasFromArtifact,
  normalizeJavascriptSymbolsFromArtifact,
} from "./normalize-family-artifacts";

export type LoadJavascriptRuntimeReferenceInventoryDependencies =
  ApiPackageArtifactResolverDependencies & {
    /**
     * Optional package version for ContractSourceBadge. When omitted, the
     * loader reads `packageVersion` from the resolved manifest when available.
     */
    packageVersion?: string;
    /** Resolve the package manifest for `packageVersion` when not injected. */
    resolveManifest?: (
      dependencies: ApiPackageArtifactResolverDependencies,
    ) => { packageVersion?: string };
  };

function readPackageVersion(
  dependencies: LoadJavascriptRuntimeReferenceInventoryDependencies,
  resolveDependencies: ApiPackageArtifactResolverDependencies,
): string | undefined {
  if (dependencies.packageVersion !== undefined) {
    const trimmed = dependencies.packageVersion.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (dependencies.resolveManifest) {
    const manifest = dependencies.resolveManifest(resolveDependencies);
    const version = manifest.packageVersion?.trim();
    return version && version.length > 0 ? version : undefined;
  }

  try {
    const artifact = resolveApiPackageArtifact("manifest", resolveDependencies);
    const data = artifact.data;
    if (
      data !== null &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      typeof (data as { packageVersion?: unknown }).packageVersion === "string"
    ) {
      const version = (
        data as { packageVersion: string }
      ).packageVersion.trim();
      return version.length > 0 ? version : undefined;
    }
  } catch {
    // Package version is optional chrome — omit when the manifest is unavailable.
  }

  return undefined;
}

/**
 * Resolve and normalize the published JavaScript runtime contract into an
 * inventory input.
 *
 * Success carries W04-normalized symbols and shared schemas. Empty contracts
 * (no symbols and no shared schemas) surface `{ state: "empty" }`.
 * Resolution/normalize failures surface `{ state: "error", detail }` so the
 * public W10 empty/error chrome renders.
 */
export function loadJavascriptRuntimeReferenceInventory(
  dependencies: LoadJavascriptRuntimeReferenceInventoryDependencies = {},
): JavaScriptRuntimeInventoryInput {
  const resolveDependencies: ApiPackageArtifactResolverDependencies = {
    ...javascriptRuntimeReferenceTurbopackLoadDependencies(),
    ...dependencies,
  };

  try {
    const artifact = resolveApiPackageArtifact(
      JAVASCRIPT_RUNTIME_REFERENCE_PUBLIC_SUBPATH,
      resolveDependencies,
    );

    if (artifact.subpath !== JAVASCRIPT_RUNTIME_REFERENCE_PUBLIC_SUBPATH) {
      return {
        state: "error",
        detail: `JavaScript runtime reference expected public subpath "${JAVASCRIPT_RUNTIME_REFERENCE_PUBLIC_SUBPATH}", resolved "${artifact.subpath}".`,
      };
    }

    const normalizeOptions = {
      publicArtifactId: artifact.specifier,
      sourcePath: artifact.resolvedPath,
    };
    const symbols = normalizeJavascriptSymbolsFromArtifact(
      artifact.data,
      normalizeOptions,
    );
    const sharedSchemas = normalizeJavascriptSharedSchemasFromArtifact(
      artifact.data,
      normalizeOptions,
    );

    if (symbols.length === 0 && sharedSchemas.length === 0) {
      return { state: "empty" };
    }

    const packageVersion = readPackageVersion(
      dependencies,
      resolveDependencies,
    );
    const inventory: JavaScriptRuntimeInventoryInput = {
      state: "success",
      symbols,
      sharedSchemas,
    };
    if (packageVersion !== undefined) {
      inventory.packageVersion = packageVersion;
    }
    return inventory;
  } catch (cause) {
    if (cause instanceof ApiPackageArtifactResolutionError) {
      return {
        state: "error",
        detail: cause.message,
      };
    }
    if (cause instanceof FamilyArtifactNormalizeError) {
      return {
        state: "error",
        detail: cause.message,
      };
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      state: "error",
      detail: message,
    };
  }
}
