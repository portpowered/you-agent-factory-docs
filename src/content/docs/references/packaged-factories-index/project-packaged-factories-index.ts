/**
 * Pure projection from the Batch 2 generated packaged-factories index corpus
 * into render-ready view entries. No filesystem IO and no replay/visualizer
 * imports — callers pass already-loaded corpus JSON.
 */

export const PACKAGED_FACTORIES_INDEX_CHILD_BASE_PATH =
  "/docs/references/packaged-factories-index" as const;

export type PackagedFactoryIndexCorpusEntryLike = {
  canonicalName: string;
  packagedDescription: string | null;
  childSlug: string;
  packageVersion: string;
  sourceRelativePath: string;
  factoryJsonText?: string;
  /**
   * Exact acquired JavaScript source for a JavaScript-only entry (no shipped
   * factory.json). Never parsed or interpreted by the projector.
   */
  javascriptSourceText?: string;
};

export type PackagedFactoryIndexCorpusLike = {
  packageName: string;
  packageVersion: string;
  entries: readonly PackagedFactoryIndexCorpusEntryLike[];
};

export type PackagedFactoryIndexViewEntry =
  | {
      kind: "factory-json";
      canonicalName: string;
      packagedDescription: string | null;
      childSlug: string;
      packageVersion: string;
      sourceRelativePath: string;
      sourceKind: "factory.json";
      childHref: `${typeof PACKAGED_FACTORIES_INDEX_CHILD_BASE_PATH}/${string}`;
      anchorId: string;
      definitionText: string;
    }
  | {
      kind: "javascript-only";
      canonicalName: string;
      packagedDescription: string | null;
      childSlug: string;
      packageVersion: string;
      sourceRelativePath: string;
      sourceKind: "javascript";
      childHref: `${typeof PACKAGED_FACTORIES_INDEX_CHILD_BASE_PATH}/${string}`;
      anchorId: string;
      definitionText: string;
      hasNoFactoryJson: true;
    };

export type PackagedFactoryIndexView = {
  packageName: string;
  packageVersion: string;
  entries: PackagedFactoryIndexViewEntry[];
};

export class PackagedFactoryIndexProjectionError extends Error {
  readonly childSlug?: string;

  constructor(
    message: string,
    options?: { childSlug?: string; cause?: unknown },
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "PackagedFactoryIndexProjectionError";
    this.childSlug = options?.childSlug;
  }
}

function childHrefFor(
  childSlug: string,
): `${typeof PACKAGED_FACTORIES_INDEX_CHILD_BASE_PATH}/${string}` {
  return `${PACKAGED_FACTORIES_INDEX_CHILD_BASE_PATH}/${childSlug}`;
}

/**
 * Project one corpus entry into a view model. Prefer shipped factory.json text;
 * otherwise require exact acquired JavaScript text for a JavaScript-only entry.
 */
export function projectPackagedFactoryIndexEntry(
  entry: PackagedFactoryIndexCorpusEntryLike,
): PackagedFactoryIndexViewEntry {
  const base = {
    canonicalName: entry.canonicalName,
    packagedDescription: entry.packagedDescription,
    childSlug: entry.childSlug,
    packageVersion: entry.packageVersion,
    sourceRelativePath: entry.sourceRelativePath,
    childHref: childHrefFor(entry.childSlug),
    anchorId: entry.childSlug,
  };

  const factoryJsonText = entry.factoryJsonText;
  if (typeof factoryJsonText === "string" && factoryJsonText.length > 0) {
    return {
      ...base,
      kind: "factory-json",
      sourceKind: "factory.json",
      definitionText: factoryJsonText,
    };
  }

  const javascriptSourceText = entry.javascriptSourceText;
  if (
    typeof javascriptSourceText === "string" &&
    javascriptSourceText.length > 0
  ) {
    return {
      ...base,
      kind: "javascript-only",
      sourceKind: "javascript",
      definitionText: javascriptSourceText,
      hasNoFactoryJson: true,
    };
  }

  throw new PackagedFactoryIndexProjectionError(
    `Packaged factory index entry "${entry.childSlug}" has neither factory.json text nor JavaScript source text.`,
    { childSlug: entry.childSlug },
  );
}

/**
 * Project the ordered generated corpus into render-ready entries. Preserves
 * corpus order (docs-owned allowlist order when the corpus is valid).
 */
export function projectPackagedFactoriesIndex(
  corpus: PackagedFactoryIndexCorpusLike,
): PackagedFactoryIndexView {
  if (!Array.isArray(corpus.entries) || corpus.entries.length === 0) {
    throw new PackagedFactoryIndexProjectionError(
      "Packaged factory index corpus is missing entries.",
    );
  }

  return {
    packageName: corpus.packageName,
    packageVersion: corpus.packageVersion,
    entries: corpus.entries.map(projectPackagedFactoryIndexEntry),
  };
}
