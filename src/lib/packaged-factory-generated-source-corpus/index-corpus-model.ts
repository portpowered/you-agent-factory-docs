/**
 * Pure ordered index corpus model for packaged-factories@0.0.2.
 *
 * Builds corpus entries from already-acquired allowlisted factory.json text.
 * No filesystem IO — callers pull via
 * `packaged-factories-filesystem-pull` and pass plain text + package metadata.
 *
 * Packaged description is taken only from straightforward published/schema
 * metadata on the definition (top-level string `description`, or a top-level
 * LOCALIZABLE_ASSET `{ type, value }` with a string value). Never invent
 * narrative prose from examples, workers, or companion JavaScript.
 */

import { createHash } from "node:crypto";
import { PACKAGED_FACTORY_V002_VERSION } from "@/lib/packaged-factory-v002/five-package-pins";
import {
  PACKAGED_FACTORIES_ALLOWLIST_SLUGS,
  type PackagedFactoriesAllowlistSlug,
  packagedFactoriesFactoryJsonRelativePath,
} from "@/lib/packaged-factory-v002/packaged-factories-allowlist";

export const PACKAGED_FACTORY_INDEX_CORPUS_FORMAT_VERSION = "1" as const;

export type PackagedFactoryIndexCorpusEntry = {
  /** Canonical factory name from factory.json `name` (for example `@you/goal`). */
  canonicalName: string;
  /**
   * Published/schema description when present on factory.json; otherwise `null`.
   * Never invented narrative.
   */
  packagedDescription: string | null;
  /** Docs-owned child slug (allowlist identity). */
  childSlug: PackagedFactoriesAllowlistSlug;
  /** Package-relative path of the acquired factory.json. */
  sourceRelativePath: `factories/${PackagedFactoriesAllowlistSlug}/factory.json`;
  /** Complete unabridged factory.json UTF-8 text as acquired. */
  factoryJsonText: string;
  /** Complete unabridged factory.json object as acquired (parsed, not rewritten). */
  factoryJson: Record<string, unknown>;
  /** Exact installed packaged-factories version (must be `0.0.2`). */
  packageVersion: typeof PACKAGED_FACTORY_V002_VERSION;
  /** SHA-256 hex of the acquired factory.json UTF-8 bytes. */
  factoryJsonSha256: string;
};

export type PackagedFactoryIndexCorpus = {
  formatVersion: typeof PACKAGED_FACTORY_INDEX_CORPUS_FORMAT_VERSION;
  packageName: "@you-agent-factory/packaged-factories";
  packageVersion: typeof PACKAGED_FACTORY_V002_VERSION;
  /** True when the installed package.json has no `exports` field (expected). */
  exportsMapAbsent: boolean;
  /** Ordered exactly by docs-owned allowlist slug order. */
  entries: PackagedFactoryIndexCorpusEntry[];
};

export type PackagedFactoryIndexCorpusErrorCode =
  | "wrong-package-version"
  | "missing-allowlisted-definition"
  | "invalid-factory-definition"
  | "slug-order-mismatch"
  | "hash-mismatch-internal";

export class PackagedFactoryIndexCorpusError extends Error {
  readonly code: PackagedFactoryIndexCorpusErrorCode;
  readonly childSlug?: PackagedFactoriesAllowlistSlug;
  readonly relativePath?: string;

  constructor(
    code: PackagedFactoryIndexCorpusErrorCode,
    message: string,
    options?: {
      childSlug?: PackagedFactoriesAllowlistSlug;
      relativePath?: string;
      cause?: unknown;
    },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryIndexCorpusError";
    this.code = code;
    this.childSlug = options?.childSlug;
    this.relativePath = options?.relativePath;
  }
}

export type AcquiredFactoryDefinitionInput = {
  childSlug: PackagedFactoriesAllowlistSlug;
  relativePath: string;
  /** Exact UTF-8 text as pulled from the package. */
  factoryJsonText: string;
};

/**
 * SHA-256 hex digest of UTF-8 source text (acquired factory.json bytes).
 */
export function hashPackagedFactorySourceText(sourceText: string): string {
  return createHash("sha256").update(sourceText, "utf8").digest("hex");
}

/**
 * Extract packaged description from straightforward published/schema metadata
 * only. Returns `null` when no such field exists — never invents prose.
 */
export function extractPackagedDescription(
  factoryJson: Record<string, unknown>,
): string | null {
  const description = factoryJson.description;
  if (typeof description === "string") {
    const trimmed = description.trim();
    return trimmed.length > 0 ? description : null;
  }

  if (
    description !== null &&
    typeof description === "object" &&
    !Array.isArray(description)
  ) {
    const asset = description as { type?: unknown; value?: unknown };
    if (
      asset.type === "LOCALIZABLE_ASSET" &&
      typeof asset.value === "string" &&
      asset.value.trim().length > 0
    ) {
      return asset.value;
    }
  }

  return null;
}

function assertObjectFactoryDefinition(
  value: unknown,
  childSlug: PackagedFactoriesAllowlistSlug,
  relativePath: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new PackagedFactoryIndexCorpusError(
      "invalid-factory-definition",
      `Allowlisted factory definition for "${childSlug}" must be a JSON object.`,
      { childSlug, relativePath },
    );
  }
  return value as Record<string, unknown>;
}

/**
 * Parse and validate one allowlisted factory.json into a corpus entry.
 * Fails closed on invalid JSON, non-object roots, or missing canonical `name`.
 */
export function buildPackagedFactoryIndexCorpusEntry(input: {
  childSlug: PackagedFactoriesAllowlistSlug;
  factoryJsonText: string;
  packageVersion: string;
  relativePath?: string;
}): PackagedFactoryIndexCorpusEntry {
  const relativePath =
    input.relativePath ??
    packagedFactoriesFactoryJsonRelativePath(input.childSlug);

  if (input.packageVersion !== PACKAGED_FACTORY_V002_VERSION) {
    throw new PackagedFactoryIndexCorpusError(
      "wrong-package-version",
      `Expected packaged-factories version "${PACKAGED_FACTORY_V002_VERSION}", got ${JSON.stringify(input.packageVersion)}.`,
      { childSlug: input.childSlug, relativePath },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.factoryJsonText);
  } catch (cause) {
    throw new PackagedFactoryIndexCorpusError(
      "invalid-factory-definition",
      `Allowlisted factory.json for "${input.childSlug}" did not parse as JSON.`,
      { childSlug: input.childSlug, relativePath, cause },
    );
  }

  const factoryJson = assertObjectFactoryDefinition(
    parsed,
    input.childSlug,
    relativePath,
  );

  const canonicalName = factoryJson.name;
  if (typeof canonicalName !== "string" || canonicalName.trim().length === 0) {
    throw new PackagedFactoryIndexCorpusError(
      "invalid-factory-definition",
      `Allowlisted factory.json for "${input.childSlug}" is missing a non-empty string "name" (canonical name).`,
      { childSlug: input.childSlug, relativePath },
    );
  }

  const expectedPath = packagedFactoriesFactoryJsonRelativePath(
    input.childSlug,
  );
  if (relativePath !== expectedPath) {
    throw new PackagedFactoryIndexCorpusError(
      "slug-order-mismatch",
      `Relative path "${relativePath}" does not match expected "${expectedPath}" for slug "${input.childSlug}".`,
      { childSlug: input.childSlug, relativePath },
    );
  }

  return {
    canonicalName,
    packagedDescription: extractPackagedDescription(factoryJson),
    childSlug: input.childSlug,
    sourceRelativePath: expectedPath,
    factoryJsonText: input.factoryJsonText,
    factoryJson,
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
    factoryJsonSha256: hashPackagedFactorySourceText(input.factoryJsonText),
  };
}

function slugFromRequiredFactoryJsonPath(
  relativePath: string,
): PackagedFactoriesAllowlistSlug | null {
  for (const slug of PACKAGED_FACTORIES_ALLOWLIST_SLUGS) {
    if (relativePath === packagedFactoriesFactoryJsonRelativePath(slug)) {
      return slug;
    }
  }
  return null;
}

/**
 * Build the ordered index corpus from acquired allowlisted factory.json inputs.
 * Order is exactly the docs-owned allowlist; missing slugs or extras fail closed.
 * Absence of an exports map must not fail (pass `exportsMapAbsent` through).
 */
export function buildPackagedFactoryIndexCorpus(input: {
  packageVersion: string;
  exportsMapAbsent: boolean;
  definitions: readonly AcquiredFactoryDefinitionInput[];
}): PackagedFactoryIndexCorpus {
  if (input.packageVersion !== PACKAGED_FACTORY_V002_VERSION) {
    throw new PackagedFactoryIndexCorpusError(
      "wrong-package-version",
      `Expected packaged-factories version "${PACKAGED_FACTORY_V002_VERSION}", got ${JSON.stringify(input.packageVersion)}.`,
    );
  }

  const bySlug = new Map<
    PackagedFactoriesAllowlistSlug,
    AcquiredFactoryDefinitionInput
  >();

  for (const definition of input.definitions) {
    const slugFromPath = slugFromRequiredFactoryJsonPath(
      definition.relativePath,
    );
    if (slugFromPath === null) {
      throw new PackagedFactoryIndexCorpusError(
        "slug-order-mismatch",
        `Acquired path "${definition.relativePath}" is not a required allowlisted factory.json path.`,
        { relativePath: definition.relativePath },
      );
    }
    if (definition.childSlug !== slugFromPath) {
      throw new PackagedFactoryIndexCorpusError(
        "slug-order-mismatch",
        `Child slug "${definition.childSlug}" does not match path "${definition.relativePath}".`,
        {
          childSlug: definition.childSlug,
          relativePath: definition.relativePath,
        },
      );
    }
    if (bySlug.has(definition.childSlug)) {
      throw new PackagedFactoryIndexCorpusError(
        "slug-order-mismatch",
        `Duplicate acquired definition for slug "${definition.childSlug}".`,
        {
          childSlug: definition.childSlug,
          relativePath: definition.relativePath,
        },
      );
    }
    bySlug.set(definition.childSlug, definition);
  }

  const entries: PackagedFactoryIndexCorpusEntry[] = [];
  for (const slug of PACKAGED_FACTORIES_ALLOWLIST_SLUGS) {
    const definition = bySlug.get(slug);
    if (definition === undefined) {
      throw new PackagedFactoryIndexCorpusError(
        "missing-allowlisted-definition",
        `Missing allowlisted factory definition for slug "${slug}".`,
        {
          childSlug: slug,
          relativePath: packagedFactoriesFactoryJsonRelativePath(slug),
        },
      );
    }
    entries.push(
      buildPackagedFactoryIndexCorpusEntry({
        childSlug: slug,
        factoryJsonText: definition.factoryJsonText,
        packageVersion: input.packageVersion,
        relativePath: definition.relativePath,
      }),
    );
  }

  if (entries.length !== PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length) {
    throw new PackagedFactoryIndexCorpusError(
      "slug-order-mismatch",
      `Corpus entry count ${entries.length} does not match allowlist length ${PACKAGED_FACTORIES_ALLOWLIST_SLUGS.length}.`,
    );
  }

  return {
    formatVersion: PACKAGED_FACTORY_INDEX_CORPUS_FORMAT_VERSION,
    packageName: "@you-agent-factory/packaged-factories",
    packageVersion: PACKAGED_FACTORY_V002_VERSION,
    exportsMapAbsent: input.exportsMapAbsent,
    entries,
  };
}
