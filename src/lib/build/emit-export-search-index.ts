import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  evaluateExportSearchParsedDocuments,
  type ResolveExportSearchParsedDocumentsResult,
  resolveExportSearchParsedDocuments,
} from "@/lib/build/export-search-parsed-documents";
import { type SiteLocale, supportedLocales } from "@/lib/i18n/locale-routing";
import { exportAdvancedOramaFromDocuments } from "@/lib/search/create-search-catalog-from-documents";
import { loadSearchDocumentsByLocale } from "@/lib/search/load-search-documents";
import type { SearchDocument } from "@/lib/search/types";
import {
  DEFAULT_EXPORT_OUT_DIR,
  verifyExportOutDirectory,
} from "./export-out-directory";
import {
  type AdvancedOramaExportPayload,
  resolveExportSearchBootstrapFilePath,
} from "./export-search-bootstrap";

export type EmitExportSearchIndexOptions = {
  outDir?: string;
  cwd?: string;
  /**
   * When true, skip parsed-document store reuse and re-parse sources.
   * Also honored via `EXPORT_SEARCH_PARSED_DOCUMENTS_FORCE=1`.
   */
  forceClean?: boolean;
  locales?: readonly SiteLocale[];
  /**
   * Optional injection of already-parsed documents (tests / callers that
   * already loaded registry/page data for the export pipeline).
   */
  documentsByLocale?: ReadonlyMap<SiteLocale, SearchDocument[]>;
  resolveParsedDocuments?: (
    options: EmitExportSearchIndexOptions & {
      cwd: string;
      locales: readonly SiteLocale[];
      forceClean: boolean;
    },
  ) => Promise<ResolveExportSearchParsedDocumentsResult>;
};

export type EmitExportSearchIndexResult =
  | {
      ok: true;
      filePaths: string[];
      parsedDocumentsSource: "reuse" | "fallback-parse" | "injected";
      parsedDocumentsReason: string;
    }
  | { ok: false; reason: string };

function readForceCleanFromEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.EXPORT_SEARCH_PARSED_DOCUMENTS_FORCE?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

async function defaultResolveParsedDocuments(options: {
  cwd: string;
  locales: readonly SiteLocale[];
  forceClean: boolean;
}): Promise<ResolveExportSearchParsedDocumentsResult> {
  return resolveExportSearchParsedDocuments({
    cwd: options.cwd,
    forceClean: options.forceClean,
    locales: options.locales,
    loadDocuments: () =>
      loadSearchDocumentsByLocale({ locales: options.locales }),
  });
}

/** Writes the Fumadocs advanced Orama export to the static bootstrap path in `out/`. */
export async function emitExportSearchIndex(
  options: EmitExportSearchIndexOptions = {},
): Promise<EmitExportSearchIndexResult> {
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const cwd = options.cwd ?? process.cwd();
  const locales = options.locales ?? supportedLocales;
  const forceClean = options.forceClean === true || readForceCleanFromEnv();

  const directoryResult = verifyExportOutDirectory(outDir, cwd);
  if (!directoryResult.ok) {
    return directoryResult;
  }

  let documentsByLocale: ReadonlyMap<SiteLocale, SearchDocument[]>;
  let parsedDocumentsSource: "reuse" | "fallback-parse" | "injected";
  let parsedDocumentsReason: string;

  if (options.documentsByLocale) {
    documentsByLocale = options.documentsByLocale;
    parsedDocumentsSource = "injected";
    parsedDocumentsReason = "caller-provided-parsed-documents";
  } else {
    const resolveParsedDocuments =
      options.resolveParsedDocuments ?? defaultResolveParsedDocuments;
    const resolved = await resolveParsedDocuments({
      ...options,
      cwd,
      locales,
      forceClean,
    });
    documentsByLocale = resolved.documentsByLocale;
    parsedDocumentsSource = resolved.source;
    parsedDocumentsReason = resolved.reason;
  }

  const filePaths: string[] = [];

  for (const locale of locales) {
    const documents = documentsByLocale.get(locale);
    if (!documents) {
      return {
        ok: false,
        reason: `Missing parsed search documents for locale "${locale}".`,
      };
    }

    const payload = (await exportAdvancedOramaFromDocuments(
      documents,
    )) as AdvancedOramaExportPayload;
    if (payload.type !== "advanced") {
      return {
        ok: false,
        reason: `Expected advanced Orama export payload, received type "${String(payload.type)}" for locale "${locale}".`,
      };
    }

    const filePath = resolveExportSearchBootstrapFilePath(outDir, cwd, locale);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `${JSON.stringify(payload)}\n`, "utf8");
    filePaths.push(filePath);
  }

  return {
    ok: true,
    filePaths,
    parsedDocumentsSource,
    parsedDocumentsReason,
  };
}

/** Expose evaluate helper for diagnostics / tests without re-exporting the module. */
export { evaluateExportSearchParsedDocuments };
