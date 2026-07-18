/**
 * Build/server helper: resolve `@you-agent-factory/api/cli` through W03 and
 * normalize into a W10 `CliCommandInventory` input for the published CLI
 * reference page.
 *
 * Do not import from client/browser UI bundles — depends on Node package
 * resolution via `resolveApiPackageArtifact`.
 */

import type { CliCommandInventoryInput } from "@/components/references/cli";
import {
  ApiPackageArtifactResolutionError,
  type ApiPackageArtifactResolverDependencies,
  resolveApiPackageArtifact,
} from "./api-package-artifact-resolver";
import {
  CLI_REFERENCE_PUBLIC_SUBPATH,
  cliReferenceTurbopackLoadDependencies,
} from "./cli-reference-turbopack";
import {
  FamilyArtifactNormalizeError,
  normalizeCliCommandsFromArtifact,
} from "./normalize-family-artifacts";

export type LoadCliReferenceInventoryDependencies =
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
  dependencies: LoadCliReferenceInventoryDependencies,
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
 * Resolve and normalize the published CLI contract into an inventory input.
 *
 * Success carries W04-normalized commands. Empty contracts surface
 * `{ state: "empty" }`. Resolution/normalize failures surface
 * `{ state: "error", detail }` so the public W10 empty/error chrome renders.
 */
export function loadCliReferenceInventory(
  dependencies: LoadCliReferenceInventoryDependencies = {},
): CliCommandInventoryInput {
  const resolveDependencies: ApiPackageArtifactResolverDependencies = {
    ...cliReferenceTurbopackLoadDependencies(),
    ...dependencies,
  };

  try {
    const artifact = resolveApiPackageArtifact(
      CLI_REFERENCE_PUBLIC_SUBPATH,
      resolveDependencies,
    );

    if (artifact.subpath !== CLI_REFERENCE_PUBLIC_SUBPATH) {
      return {
        state: "error",
        detail: `CLI reference expected public subpath "${CLI_REFERENCE_PUBLIC_SUBPATH}", resolved "${artifact.subpath}".`,
      };
    }

    const commands = normalizeCliCommandsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
      sourcePath: artifact.resolvedPath,
    });

    if (commands.length === 0) {
      return { state: "empty" };
    }

    const packageVersion = readPackageVersion(
      dependencies,
      resolveDependencies,
    );
    const inventory: CliCommandInventoryInput = {
      state: "success",
      commands,
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
