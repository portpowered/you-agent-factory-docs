/**
 * Pure consumed-hash ledger types, builder, and TypeScript module renderer for
 * `@you-agent-factory/api` public exports.
 *
 * Keep this module free of filesystem and package-resolution IO so ledger
 * bytes stay deterministic for identical validated inputs.
 */

import { renderTypescriptLiteral } from "@/lib/content/render-typescript-literal";
import type { ValidatedApiPackageExportFormatVersions } from "./api-package-format-version-gate";
import type { ApiPackageManifest } from "./api-package-manifest";
import {
  API_PACKAGE_FIXED_PUBLIC_SUBPATHS,
  toApiPackageExportSpecifier,
} from "./api-package-public-exports";

/** Ledger document format version emitted by this docs build. */
export const API_PACKAGE_CONSUMED_HASH_LEDGER_FORMAT_VERSION = "1" as const;

/**
 * Default public exports this acquisition lane consumes for the ledger.
 * Excludes `manifest` (membership authority, not a member export).
 */
export const DEFAULT_API_PACKAGE_CONSUMED_EXPORT_REQUIREMENTS: ReadonlyArray<{
  target: string;
  dependentReferenceFamily: string;
}> = API_PACKAGE_FIXED_PUBLIC_SUBPATHS.filter(
  (subpath) => subpath !== "manifest",
).map((subpath) => ({
  target: subpath,
  dependentReferenceFamily: `${subpath}-reference`,
}));

export type ApiPackageConsumedHashLedgerEntry = {
  /** Documented public subpath that was consumed. */
  subpath: string;
  /** Canonical package export specifier. */
  specifier: string;
  /** Manifest export identity (for example `generated.cli.commands`). */
  exportId: string;
  /** Package-relative artifact path recorded in the manifest. */
  path: string;
  /** Artifact family recorded in the manifest. */
  family: string;
  /** Manifest `artifactHash` for the consumed export. */
  artifactHash: string;
  /** Caller-supplied consumer identity that required this export. */
  dependentReferenceFamily: string;
};

export type ApiPackageConsumedHashLedger = {
  formatVersion: typeof API_PACKAGE_CONSUMED_HASH_LEDGER_FORMAT_VERSION;
  packageId: string;
  packageVersion: string;
  sourceCommit: string;
  manifestFormatVersion: string;
  entries: ApiPackageConsumedHashLedgerEntry[];
};

export type ApiPackageConsumedHashLedgerInput = Pick<
  ValidatedApiPackageExportFormatVersions,
  | "subpath"
  | "specifier"
  | "exportId"
  | "path"
  | "entry"
  | "dependentReferenceFamily"
  | "manifest"
>;

function compareLedgerEntries(
  left: ApiPackageConsumedHashLedgerEntry,
  right: ApiPackageConsumedHashLedgerEntry,
): number {
  const bySubpath = left.subpath.localeCompare(right.subpath);
  if (bySubpath !== 0) {
    return bySubpath;
  }
  return left.exportId.localeCompare(right.exportId);
}

/**
 * Build a deterministic consumed-hash ledger from validated exports.
 * Identical validated inputs always produce identical ledger content.
 */
export function buildApiPackageConsumedHashLedger(
  validatedExports: readonly ApiPackageConsumedHashLedgerInput[],
  packageIdentity?: Pick<
    ApiPackageManifest,
    "packageId" | "packageVersion" | "sourceCommit" | "formatVersion"
  >,
): ApiPackageConsumedHashLedger {
  if (validatedExports.length === 0) {
    throw new Error(
      "Cannot build an @you-agent-factory/api consumed-hash ledger with zero validated exports.",
    );
  }

  const identity = packageIdentity ?? validatedExports[0]?.manifest;
  if (identity === undefined) {
    throw new Error(
      "Cannot build an @you-agent-factory/api consumed-hash ledger without package identity.",
    );
  }

  const entries = validatedExports
    .map((validated) => ({
      subpath: validated.subpath,
      specifier:
        validated.specifier.length > 0
          ? validated.specifier
          : toApiPackageExportSpecifier(validated.subpath),
      exportId: validated.exportId,
      path: validated.path,
      family: validated.entry.family,
      artifactHash: validated.entry.artifactHash,
      dependentReferenceFamily: validated.dependentReferenceFamily,
    }))
    .sort(compareLedgerEntries);

  return {
    formatVersion: API_PACKAGE_CONSUMED_HASH_LEDGER_FORMAT_VERSION,
    packageId: identity.packageId,
    packageVersion: identity.packageVersion,
    sourceCommit: identity.sourceCommit,
    manifestFormatVersion: identity.formatVersion,
    entries,
  };
}

/**
 * Render the ledger as a Biome-stable generated TypeScript module.
 * Identical ledgers always produce identical module bytes.
 */
export function renderApiPackageConsumedHashLedgerModule(
  ledger: ApiPackageConsumedHashLedger,
): string {
  return [
    "/**",
    " * AUTO-GENERATED FILE. DO NOT EDIT.",
    " *",
    " * Source: scripts/generate-api-package-consumed-hash-ledger.ts",
    " * Authoritative inputs: validated @you-agent-factory/api public exports",
    " * and their published manifest artifact hashes.",
    " */",
    "",
    `export const apiPackageConsumedHashLedger = ${renderTypescriptLiteral(ledger)} as const;`,
    "",
    "export type ApiPackageConsumedHashLedgerGenerated =",
    "  typeof apiPackageConsumedHashLedger;",
    "",
  ].join("\n");
}
