/**
 * Fingerprint-gated store of parsed search documents for static-export
 * search-index emission.
 *
 * When contracted inputs are unchanged and a prior store is present and valid,
 * `emit-export-search-index` reuses the documents instead of re-walking
 * registry/page/blog sources. Missing/corrupt stores, fingerprint mismatch, or
 * force-clean fall back to a full parse.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  type ContentRuntimeFingerprintDependencies,
  type ContentRuntimeStepFingerprintInputs,
  computeContentRuntimeStepFingerprint,
} from "@/lib/content/content-runtime-fingerprints";
import { type SiteLocale, supportedLocales } from "@/lib/i18n/locale-routing";
import type { SearchDocument } from "@/lib/search/types";

/**
 * Bump when store material or serialization changes so warm reuse invalidates
 * across builds after a format change.
 */
export const EXPORT_SEARCH_PARSED_DOCUMENTS_SCHEMA_VERSION = 1;

/**
 * Store lives under `.source` so clean benchmark prep (which wipes `.source`)
 * clears reuse state together with the fumadocs intermediate.
 */
export const EXPORT_SEARCH_PARSED_DOCUMENTS_STORE_RELATIVE_PATH =
  ".source/.export-search-parsed-documents.json";

/**
 * Declared fingerprint surfaces for parsed search-document reuse.
 * Paths are repo-relative and stable across machines.
 */
export const EXPORT_SEARCH_PARSED_DOCUMENTS_FINGERPRINT_INPUTS: ContentRuntimeStepFingerprintInputs =
  {
    stepId: "export-search-parsed-documents",
    inputPaths: [
      "src/content/docs",
      "src/content/registry",
      "src/content/blog",
    ],
    generatorPaths: [
      "scripts/emit-export-search-index.ts",
      "src/lib/build/emit-export-search-index.ts",
      "src/lib/build/export-search-parsed-documents.ts",
      "src/lib/search/load-search-documents.ts",
      "src/lib/search/build-documents.ts",
      "src/lib/search/build-blog-search-document.ts",
      "src/lib/search/create-search-catalog-from-documents.ts",
    ],
    schemaPaths: [
      "src/lib/content/schemas.ts",
      "src/lib/search/types.ts",
      "src/lib/i18n/locale-routing.ts",
    ],
  };

export type ExportSearchParsedDocumentsStore = {
  schemaVersion: number;
  fingerprint: string;
  documentsByLocale: Record<string, SearchDocument[]>;
};

export type ExportSearchParsedDocumentsDecision =
  | {
      action: "reuse";
      reason: "cache-hit";
      fingerprint: string;
      documentsByLocale: ReadonlyMap<SiteLocale, SearchDocument[]>;
    }
  | {
      action: "regenerate";
      reason:
        | "force-clean"
        | "missing-or-corrupt-store"
        | "fingerprint-miss"
        | "incomplete-locale-coverage";
      fingerprint: string;
    };

export type ResolveExportSearchParsedDocumentsOptions = {
  cwd: string;
  forceClean?: boolean;
  locales?: readonly SiteLocale[];
  dependencies?: ContentRuntimeFingerprintDependencies;
  /** Test/helper override; when set, skips hashing contracted inputs. */
  fingerprintOverride?: string;
};

function defaultWriteFile(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

export function resolveExportSearchParsedDocumentsStorePath(
  cwd: string,
): string {
  return join(cwd, EXPORT_SEARCH_PARSED_DOCUMENTS_STORE_RELATIVE_PATH);
}

export function computeExportSearchParsedDocumentsFingerprint(
  cwd: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
  inputs: ContentRuntimeStepFingerprintInputs = EXPORT_SEARCH_PARSED_DOCUMENTS_FINGERPRINT_INPUTS,
): string {
  return computeContentRuntimeStepFingerprint(cwd, inputs, dependencies);
}

function isSearchDocumentArray(value: unknown): value is SearchDocument[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry !== null &&
        typeof entry === "object" &&
        typeof (entry as SearchDocument).url === "string" &&
        typeof (entry as SearchDocument).title === "string",
    )
  );
}

export function readExportSearchParsedDocumentsStore(
  cwd: string,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): ExportSearchParsedDocumentsStore | null {
  const fileExists = dependencies.fileExists ?? existsSync;
  const readFile =
    dependencies.readFile ?? ((path) => readFileSync(path, "utf8"));
  const storePath = resolveExportSearchParsedDocumentsStorePath(cwd);

  if (!fileExists(storePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      readFile(storePath),
    ) as Partial<ExportSearchParsedDocumentsStore>;
    if (
      parsed.schemaVersion !== EXPORT_SEARCH_PARSED_DOCUMENTS_SCHEMA_VERSION ||
      typeof parsed.fingerprint !== "string" ||
      parsed.fingerprint.length === 0 ||
      parsed.documentsByLocale === null ||
      typeof parsed.documentsByLocale !== "object"
    ) {
      return null;
    }

    for (const documents of Object.values(parsed.documentsByLocale)) {
      if (!isSearchDocumentArray(documents)) {
        return null;
      }
    }

    return {
      schemaVersion: parsed.schemaVersion,
      fingerprint: parsed.fingerprint,
      documentsByLocale: parsed.documentsByLocale as Record<
        string,
        SearchDocument[]
      >,
    };
  } catch {
    return null;
  }
}

export function writeExportSearchParsedDocumentsStore(
  cwd: string,
  fingerprint: string,
  documentsByLocale: ReadonlyMap<SiteLocale, SearchDocument[]>,
  dependencies: ContentRuntimeFingerprintDependencies = {},
): void {
  const writeFile = dependencies.writeFile ?? defaultWriteFile;
  const serialized: Record<string, SearchDocument[]> = {};
  for (const [locale, documents] of documentsByLocale) {
    serialized[locale] = documents;
  }

  const store: ExportSearchParsedDocumentsStore = {
    schemaVersion: EXPORT_SEARCH_PARSED_DOCUMENTS_SCHEMA_VERSION,
    fingerprint,
    documentsByLocale: serialized,
  };
  writeFile(
    resolveExportSearchParsedDocumentsStorePath(cwd),
    `${JSON.stringify(store)}\n`,
  );
}

function mapStoreDocuments(
  store: ExportSearchParsedDocumentsStore,
  locales: readonly SiteLocale[],
): ReadonlyMap<SiteLocale, SearchDocument[]> | null {
  const documentsByLocale = new Map<SiteLocale, SearchDocument[]>();
  for (const locale of locales) {
    const documents = store.documentsByLocale[locale];
    if (!isSearchDocumentArray(documents)) {
      return null;
    }
    documentsByLocale.set(locale, documents);
  }
  return documentsByLocale;
}

/**
 * Decide whether prior parsed search documents can be reused for emission.
 */
export function evaluateExportSearchParsedDocuments(options: {
  cwd: string;
  forceClean?: boolean;
  locales?: readonly SiteLocale[];
  dependencies?: ContentRuntimeFingerprintDependencies;
  fingerprintOverride?: string;
}): ExportSearchParsedDocumentsDecision {
  const dependencies = options.dependencies ?? {};
  const locales = options.locales ?? supportedLocales;
  const fingerprint =
    options.fingerprintOverride ??
    computeExportSearchParsedDocumentsFingerprint(options.cwd, dependencies);

  if (options.forceClean === true) {
    return {
      action: "regenerate",
      reason: "force-clean",
      fingerprint,
    };
  }

  const store = readExportSearchParsedDocumentsStore(options.cwd, dependencies);
  if (!store) {
    return {
      action: "regenerate",
      reason: "missing-or-corrupt-store",
      fingerprint,
    };
  }

  if (store.fingerprint !== fingerprint) {
    return {
      action: "regenerate",
      reason: "fingerprint-miss",
      fingerprint,
    };
  }

  const documentsByLocale = mapStoreDocuments(store, locales);
  if (!documentsByLocale) {
    return {
      action: "regenerate",
      reason: "incomplete-locale-coverage",
      fingerprint,
    };
  }

  return {
    action: "reuse",
    reason: "cache-hit",
    fingerprint,
    documentsByLocale,
  };
}

export type ResolveExportSearchParsedDocumentsResult =
  | {
      source: "reuse";
      reason: "cache-hit";
      fingerprint: string;
      documentsByLocale: ReadonlyMap<SiteLocale, SearchDocument[]>;
    }
  | {
      source: "fallback-parse";
      reason: ExportSearchParsedDocumentsDecision["reason"];
      fingerprint: string;
      documentsByLocale: ReadonlyMap<SiteLocale, SearchDocument[]>;
    };

export type ResolveExportSearchParsedDocumentsWithLoaderOptions =
  ResolveExportSearchParsedDocumentsOptions & {
    loadDocuments?: () => Promise<ReadonlyMap<SiteLocale, SearchDocument[]>>;
  };

/**
 * Resolve parsed search documents for export emission: reuse a valid store
 * when safe, otherwise fall back to a full parse and refresh the store.
 */
export async function resolveExportSearchParsedDocuments(
  options: ResolveExportSearchParsedDocumentsWithLoaderOptions,
): Promise<ResolveExportSearchParsedDocumentsResult> {
  const locales = options.locales ?? supportedLocales;
  const decision = evaluateExportSearchParsedDocuments({
    cwd: options.cwd,
    forceClean: options.forceClean,
    locales,
    dependencies: options.dependencies,
    fingerprintOverride: options.fingerprintOverride,
  });

  if (decision.action === "reuse") {
    return {
      source: "reuse",
      reason: decision.reason,
      fingerprint: decision.fingerprint,
      documentsByLocale: decision.documentsByLocale,
    };
  }

  if (!options.loadDocuments) {
    throw new Error(
      "resolveExportSearchParsedDocuments requires loadDocuments when the parsed-documents store cannot be reused.",
    );
  }

  const documentsByLocale = await options.loadDocuments();
  writeExportSearchParsedDocumentsStore(
    options.cwd,
    decision.fingerprint,
    documentsByLocale,
    options.dependencies,
  );

  return {
    source: "fallback-parse",
    reason: decision.reason,
    fingerprint: decision.fingerprint,
    documentsByLocale,
  };
}
