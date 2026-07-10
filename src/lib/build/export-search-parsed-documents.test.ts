import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SearchDocument } from "@/lib/search/types";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "@/lib/search/types";
import {
  EXPORT_SEARCH_PARSED_DOCUMENTS_STORE_RELATIVE_PATH,
  evaluateExportSearchParsedDocuments,
  resolveExportSearchParsedDocuments,
  writeExportSearchParsedDocumentsStore,
} from "./export-search-parsed-documents";

const cleanupPaths: string[] = [];

afterEach(() => {
  for (const path of cleanupPaths.splice(0)) {
    rmSync(path, { force: true, recursive: true });
  }
});

function makeDocument(url: string, title: string): SearchDocument {
  return {
    id: url,
    url,
    kind: "guide",
    title,
    description: `${title} description`,
    bodyText: title,
    headings: [title],
    directAliases: [],
    aliases: [],
    tags: [],
    relatedIds: [],
    facets: { kind: "guide", tags: [] },
    topology: { ...EMPTY_SEARCH_DOCUMENT_TOPOLOGY },
  };
}

function createWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), "export-search-parsed-"));
  cleanupPaths.push(root);
  mkdirSync(join(root, ".source"), { recursive: true });
  return root;
}

describe("export-search-parsed-documents", () => {
  test("reuses a fingerprint-fresh store with full locale coverage", async () => {
    const cwd = createWorkspace();
    const fingerprint = "fp-reuse";
    const documentsByLocale = new Map([
      ["en" as const, [makeDocument("/docs/a", "A")]],
      ["ja" as const, [makeDocument("/ja/docs/a", "A ja")]],
      ["zh-CN" as const, [makeDocument("/zh-CN/docs/a", "A zh")]],
      ["vi" as const, [makeDocument("/vi/docs/a", "A vi")]],
    ]);

    writeExportSearchParsedDocumentsStore(cwd, fingerprint, documentsByLocale);

    const decision = evaluateExportSearchParsedDocuments({
      cwd,
      locales: ["en", "ja", "zh-CN", "vi"],
      fingerprintOverride: fingerprint,
    });

    expect(decision.action).toBe("reuse");
    if (decision.action === "reuse") {
      expect(decision.documentsByLocale.get("en")?.[0]?.title).toBe("A");
    }

    let loadCount = 0;
    const resolved = await resolveExportSearchParsedDocuments({
      cwd,
      locales: ["en", "ja", "zh-CN", "vi"],
      fingerprintOverride: fingerprint,
      loadDocuments: async () => {
        loadCount += 1;
        return documentsByLocale;
      },
    });

    expect(resolved.source).toBe("reuse");
    expect(loadCount).toBe(0);
  });

  test("falls back to parse when the store is missing and refreshes the store", async () => {
    const cwd = createWorkspace();
    const fingerprint = "fp-miss";
    const documentsByLocale = new Map([
      ["en" as const, [makeDocument("/docs/a", "A")]],
    ]);

    let loadCount = 0;
    const resolved = await resolveExportSearchParsedDocuments({
      cwd,
      locales: ["en"],
      fingerprintOverride: fingerprint,
      loadDocuments: async () => {
        loadCount += 1;
        return documentsByLocale;
      },
    });

    expect(resolved.source).toBe("fallback-parse");
    expect(resolved.reason).toBe("missing-or-corrupt-store");
    expect(loadCount).toBe(1);

    const second = await resolveExportSearchParsedDocuments({
      cwd,
      locales: ["en"],
      fingerprintOverride: fingerprint,
      loadDocuments: async () => {
        loadCount += 1;
        return documentsByLocale;
      },
    });

    expect(second.source).toBe("reuse");
    expect(loadCount).toBe(1);
    expect(
      join(cwd, EXPORT_SEARCH_PARSED_DOCUMENTS_STORE_RELATIVE_PATH),
    ).toContain(".export-search-parsed-documents.json");
  });

  test("falls back when the store is corrupt", () => {
    const cwd = createWorkspace();
    writeFileSync(
      join(cwd, EXPORT_SEARCH_PARSED_DOCUMENTS_STORE_RELATIVE_PATH),
      "{not-json",
      "utf8",
    );

    const decision = evaluateExportSearchParsedDocuments({
      cwd,
      locales: ["en"],
      fingerprintOverride: "fp",
    });

    expect(decision).toEqual({
      action: "regenerate",
      reason: "missing-or-corrupt-store",
      fingerprint: "fp",
    });
  });

  test("falls back on fingerprint miss", () => {
    const cwd = createWorkspace();
    writeExportSearchParsedDocumentsStore(
      cwd,
      "old-fp",
      new Map([["en", [makeDocument("/docs/a", "A")]]]),
    );

    const decision = evaluateExportSearchParsedDocuments({
      cwd,
      locales: ["en"],
      fingerprintOverride: "new-fp",
    });

    expect(decision).toEqual({
      action: "regenerate",
      reason: "fingerprint-miss",
      fingerprint: "new-fp",
    });
  });

  test("force-clean always regenerates", () => {
    const cwd = createWorkspace();
    writeExportSearchParsedDocumentsStore(
      cwd,
      "fp",
      new Map([["en", [makeDocument("/docs/a", "A")]]]),
    );

    const decision = evaluateExportSearchParsedDocuments({
      cwd,
      locales: ["en"],
      forceClean: true,
      fingerprintOverride: "fp",
    });

    expect(decision).toEqual({
      action: "regenerate",
      reason: "force-clean",
      fingerprint: "fp",
    });
  });
});
