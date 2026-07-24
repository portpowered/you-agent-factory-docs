/**
 * Pure companion JavaScript source model for packaged-factories@0.0.2.
 *
 * Preserves allowlisted deep-research workflow JS as complete raw UTF-8 text
 * plus only straightforward metadata already available from the package /
 * factory.json (canonical name, child slug, package version, source kind,
 * relative path, SHA-256). Never parses, executes, traverses, interprets, or
 * summarizes the JavaScript — no derived stage/worker/call-graph artifacts.
 *
 * No filesystem IO — callers pull via `packaged-factories-filesystem-pull`
 * and pass plain text + package/factory metadata.
 */

import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import { PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS } from "@/lib/packaged-factory-v002/packaged-factories-allowlist";
import { hashPackagedFactorySourceText } from "./index-corpus-model";

/** Docs-owned allowlisted companion path required by this corpus lane. */
export const DEEP_RESEARCH_COMPANION_RELATIVE_PATH =
  PACKAGED_FACTORIES_OPTIONAL_COMPANION_RELATIVE_PATHS[0];

export const PACKAGED_FACTORY_COMPANION_SOURCE_FORMAT_VERSION = "1" as const;

/**
 * Straightforward source-kind label for allowlisted companion JavaScript.
 * Not derived from inspecting the script body.
 */
export const PACKAGED_FACTORY_COMPANION_SOURCE_KIND =
  "companion-javascript" as const;

export const DEEP_RESEARCH_CHILD_SLUG = "deep-research" as const;

export type PackagedFactoryCompanionSource = {
  formatVersion: typeof PACKAGED_FACTORY_COMPANION_SOURCE_FORMAT_VERSION;
  /** Straightforward kind label — not inferred from script contents. */
  sourceKind: typeof PACKAGED_FACTORY_COMPANION_SOURCE_KIND;
  /** Docs-owned child slug for deep-research. */
  childSlug: typeof DEEP_RESEARCH_CHILD_SLUG;
  /** Canonical factory name from deep-research factory.json `name`. */
  canonicalName: string;
  /** Exact installed packaged-factories version (must be `0.0.2`). */
  packageVersion: typeof PACKAGED_FACTORY_V002_VERSION;
  /** Package-relative allowlisted companion path. */
  relativePath: typeof DEEP_RESEARCH_COMPANION_RELATIVE_PATH;
  /** Complete raw UTF-8 companion JavaScript text as acquired — never rewritten. */
  sourceText: string;
  /** SHA-256 hex of the acquired companion UTF-8 bytes. */
  sourceSha256: string;
};

export type PackagedFactoryCompanionSourceErrorCode =
  | "wrong-package-version"
  | "missing-allowlisted-companion"
  | "empty-companion-source"
  | "invalid-companion-metadata"
  | "companion-path-mismatch";

export class PackagedFactoryCompanionSourceError extends Error {
  readonly code: PackagedFactoryCompanionSourceErrorCode;
  readonly relativePath?: string;

  constructor(
    code: PackagedFactoryCompanionSourceErrorCode,
    message: string,
    options?: { relativePath?: string; cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryCompanionSourceError";
    this.code = code;
    this.relativePath = options?.relativePath;
  }
}

export type AcquiredCompanionSourceInput = {
  /** Exact UTF-8 companion JavaScript text as pulled from the package. */
  sourceText: string;
  relativePath: string;
  /** Canonical name from deep-research factory.json (not from JS). */
  canonicalName: string;
  packageVersion: string;
};

/**
 * Build the deep-research companion source artifact from already-acquired
 * raw JavaScript text and straightforward package/factory metadata.
 *
 * Does not parse or interpret `sourceText` beyond hashing UTF-8 bytes.
 * Fails closed on wrong version, empty text, bad metadata, or path mismatch.
 */
export function buildDeepResearchCompanionSource(
  input: AcquiredCompanionSourceInput,
): PackagedFactoryCompanionSource {
  if (input.packageVersion !== PACKAGED_FACTORY_V002_VERSION) {
    throw new PackagedFactoryCompanionSourceError(
      "wrong-package-version",
      `Expected packaged-factories version "${PACKAGED_FACTORY_V002_VERSION}", got ${JSON.stringify(input.packageVersion)}.`,
      { relativePath: input.relativePath },
    );
  }

  if (input.relativePath !== DEEP_RESEARCH_COMPANION_RELATIVE_PATH) {
    throw new PackagedFactoryCompanionSourceError(
      "companion-path-mismatch",
      `Companion relative path ${JSON.stringify(input.relativePath)} does not match required allowlisted path "${DEEP_RESEARCH_COMPANION_RELATIVE_PATH}".`,
      { relativePath: input.relativePath },
    );
  }

  if (
    typeof input.canonicalName !== "string" ||
    input.canonicalName.trim().length === 0
  ) {
    throw new PackagedFactoryCompanionSourceError(
      "invalid-companion-metadata",
      `Companion source requires a non-empty canonical name from deep-research factory.json.`,
      { relativePath: input.relativePath },
    );
  }

  if (
    typeof input.sourceText !== "string" ||
    input.sourceText.trim().length === 0
  ) {
    throw new PackagedFactoryCompanionSourceError(
      "empty-companion-source",
      `Allowlisted companion JavaScript at "${DEEP_RESEARCH_COMPANION_RELATIVE_PATH}" is missing or empty; refusing to invent substitute source.`,
      { relativePath: input.relativePath },
    );
  }

  return {
    formatVersion: PACKAGED_FACTORY_COMPANION_SOURCE_FORMAT_VERSION,
    sourceKind: PACKAGED_FACTORY_COMPANION_SOURCE_KIND,
    childSlug: DEEP_RESEARCH_CHILD_SLUG,
    canonicalName: input.canonicalName,
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
    relativePath: DEEP_RESEARCH_COMPANION_RELATIVE_PATH,
    sourceText: input.sourceText,
    sourceSha256: hashPackagedFactorySourceText(input.sourceText),
  };
}
