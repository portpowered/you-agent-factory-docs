/**
 * Build/server helper: resolve `@you-agent-factory/api/mcp` through W03 and
 * normalize into a W10 `McpToolInventory` input for the published MCP
 * reference page.
 *
 * Do not import from client/browser UI bundles — depends on Node package
 * resolution via `resolveApiPackageArtifact`.
 */

import type { McpToolInventoryInput } from "@/components/references/mcp";
import {
  ApiPackageArtifactResolutionError,
  type ApiPackageArtifactResolverDependencies,
  resolveApiPackageArtifact,
} from "./api-package-artifact-resolver";
import {
  MCP_REFERENCE_PUBLIC_SUBPATH,
  mcpReferenceTurbopackLoadDependencies,
} from "./mcp-reference-turbopack";
import {
  FamilyArtifactNormalizeError,
  normalizeMcpToolsFromArtifact,
} from "./normalize-family-artifacts";

export type LoadMcpReferenceInventoryDependencies =
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
  dependencies: LoadMcpReferenceInventoryDependencies,
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
 * Resolve and normalize the published MCP contract into an inventory input.
 *
 * Success carries W04-normalized tools. Empty contracts surface
 * `{ state: "empty" }`. Resolution/normalize failures surface
 * `{ state: "error", detail }` so the public W10 empty/error chrome renders.
 */
export function loadMcpReferenceInventory(
  dependencies: LoadMcpReferenceInventoryDependencies = {},
): McpToolInventoryInput {
  const resolveDependencies: ApiPackageArtifactResolverDependencies = {
    ...mcpReferenceTurbopackLoadDependencies(),
    ...dependencies,
  };

  try {
    const artifact = resolveApiPackageArtifact(
      MCP_REFERENCE_PUBLIC_SUBPATH,
      resolveDependencies,
    );

    if (artifact.subpath !== MCP_REFERENCE_PUBLIC_SUBPATH) {
      return {
        state: "error",
        detail: `MCP reference expected public subpath "${MCP_REFERENCE_PUBLIC_SUBPATH}", resolved "${artifact.subpath}".`,
      };
    }

    const tools = normalizeMcpToolsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
      sourcePath: artifact.resolvedPath,
    });

    if (tools.length === 0) {
      return { state: "empty" };
    }

    const packageVersion = readPackageVersion(
      dependencies,
      resolveDependencies,
    );
    const inventory: McpToolInventoryInput = {
      state: "success",
      tools,
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
