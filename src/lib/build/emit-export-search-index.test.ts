import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SearchDocument } from "@/lib/search/types";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "@/lib/search/types";
import { emitExportSearchIndex } from "./emit-export-search-index";
import {
  EXPORT_SEARCH_PARSED_DOCUMENTS_STORE_RELATIVE_PATH,
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
    bodyText: `${title} body`,
    headings: [title],
    directAliases: [],
    aliases: [],
    tags: ["guides"],
    relatedIds: [],
    facets: { kind: "guide", tags: ["guides"] },
    topology: { ...EMPTY_SEARCH_DOCUMENT_TOPOLOGY },
  };
}

function createExportWorkspace(): { cwd: string; outDir: string } {
  const cwd = mkdtempSync(join(tmpdir(), "emit-export-search-"));
  cleanupPaths.push(cwd);
  const outDir = join(cwd, "out");
  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(cwd, ".source"), { recursive: true });
  // Minimal index marker so verifyExportOutDirectory accepts the out dir.
  writeIndexHtml(outDir);
  return { cwd, outDir };
}

function writeIndexHtml(outDir: string): void {
  writeFileSync(join(outDir, "index.html"), "<html></html>\n", "utf8");
}

describe("emitExportSearchIndex parsed-document reuse", () => {
  test("reuses injected parsed documents without a source walk", async () => {
    const { cwd, outDir } = createExportWorkspace();
    const documentsByLocale = new Map([
      [
        "en" as const,
        [makeDocument("/docs/getting-started", "Getting started")],
      ],
    ]);

    const result = await emitExportSearchIndex({
      cwd,
      outDir,
      locales: ["en"],
      documentsByLocale,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.parsedDocumentsSource).toBe("injected");
    expect(result.filePaths).toHaveLength(1);
    const bootstrapPath = result.filePaths[0];
    expect(bootstrapPath).toBeDefined();
    if (!bootstrapPath) {
      return;
    }

    const payload = JSON.parse(readFileSync(bootstrapPath, "utf8")) as {
      type: string;
    };
    expect(payload.type).toBe("advanced");
  });

  test("falls back to parse when reuse data is unavailable, then reuses on the next emit", async () => {
    const { cwd, outDir } = createExportWorkspace();
    const documentsByLocale = new Map([
      [
        "en" as const,
        [makeDocument("/docs/getting-started", "Getting started")],
      ],
    ]);

    let loadCount = 0;
    const first = await emitExportSearchIndex({
      cwd,
      outDir,
      locales: ["en"],
      resolveParsedDocuments: async () => {
        loadCount += 1;
        writeExportSearchParsedDocumentsStore(
          cwd,
          "fp-emit",
          documentsByLocale,
        );
        return {
          source: "fallback-parse" as const,
          reason: "missing-or-corrupt-store" as const,
          fingerprint: "fp-emit",
          documentsByLocale,
        };
      },
    });

    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.parsedDocumentsSource).toBe("fallback-parse");
    expect(loadCount).toBe(1);
    expect(
      readFileSync(
        join(cwd, EXPORT_SEARCH_PARSED_DOCUMENTS_STORE_RELATIVE_PATH),
        "utf8",
      ),
    ).toContain("Getting started");

    const second = await emitExportSearchIndex({
      cwd,
      outDir,
      locales: ["en"],
      resolveParsedDocuments: async () => {
        loadCount += 1;
        return {
          source: "reuse" as const,
          reason: "cache-hit" as const,
          fingerprint: "fp-emit",
          documentsByLocale,
        };
      },
    });

    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.parsedDocumentsSource).toBe("reuse");
    expect(loadCount).toBe(2);

    const firstPath = first.filePaths[0];
    const secondPath = second.filePaths[0];
    expect(firstPath).toBeDefined();
    expect(secondPath).toBeDefined();
    if (!firstPath || !secondPath) {
      return;
    }
    const firstPayload = readFileSync(firstPath, "utf8");
    const secondPayload = readFileSync(secondPath, "utf8");
    expect(secondPayload).toBe(firstPayload);
  });
});
