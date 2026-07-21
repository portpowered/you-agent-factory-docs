/**
 * Story refs-w16-search-anchor-projection-007 proof: every shipped locale
 * search catalog carries the same canonical English reference identifiers
 * and aliases, and English identifier queries succeed against non-en catalogs.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 * Does not implement W17 chrome/language-boundary localization.
 */
import { describe, expect, test } from "bun:test";
import { FACTORY_SHIPPED_LOCALES } from "@/lib/content/factory-locale-base-path";
import {
  FACTORY_SEARCH_ORAMA_LANGUAGE,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  referenceItemEnglishSearchFields,
  resetReferenceItemSearchDocumentsCacheForTests,
} from "@/lib/search";
import { loadSearchDocumentsByLocale } from "@/lib/search/load-search-documents";
import { docsSearchApi } from "@/lib/search/search-server";

const NON_DEFAULT_LOCALES = FACTORY_SHIPPED_LOCALES.filter(
  (locale) => locale !== "en",
);

function fingerprint(
  fields: ReturnType<typeof referenceItemEnglishSearchFields>,
): string {
  return JSON.stringify({
    id: fields.id,
    title: fields.title,
    url: fields.url,
    aliases: [...fields.aliases].sort(),
  });
}

describe("factory search English identifiers in every locale (W16-007)", () => {
  test("Orama catalogs always use English language (not UI locale)", () => {
    expect(FACTORY_SEARCH_ORAMA_LANGUAGE).toBe("english");
  });

  test("shipped locale document builds share identical English reference identifiers", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const byLocale = await loadSearchDocumentsByLocale({
      locales: [...FACTORY_SHIPPED_LOCALES],
    });

    const englishDocs = byLocale.get("en");
    expect(englishDocs).toBeDefined();
    if (englishDocs === undefined) {
      throw new Error("expected en search documents");
    }

    const englishReferenceItems = englishDocs.filter(
      (document) =>
        document.kind === REFERENCE_SEARCH_DOCUMENT_KIND &&
        document.url.includes("#"),
    );
    expect(englishReferenceItems.length).toBeGreaterThan(0);

    const englishFingerprints = new Map(
      englishReferenceItems.map((document) => {
        const fields = referenceItemEnglishSearchFields(document);
        return [fields.id, fingerprint(fields)] as const;
      }),
    );

    for (const locale of FACTORY_SHIPPED_LOCALES) {
      const documents = byLocale.get(locale);
      expect(documents).toBeDefined();
      if (documents === undefined) {
        throw new Error(`expected search documents for locale ${locale}`);
      }

      const referenceItems = documents.filter(
        (document) =>
          document.kind === REFERENCE_SEARCH_DOCUMENT_KIND &&
          document.url.includes("#"),
      );
      expect(referenceItems.length).toBe(englishReferenceItems.length);

      for (const document of referenceItems) {
        const fields = referenceItemEnglishSearchFields(document);
        expect(englishFingerprints.get(fields.id)).toBe(fingerprint(fields));
        // Contract literals stay English — no locale-prefixed item URLs.
        expect(fields.url.startsWith("/docs/references/")).toBe(true);
        expect(fields.url.includes(`/${locale}/`)).toBe(false);
      }
    }
  });

  test("representative English identifier queries succeed on non-en locale catalogs", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();

    const fixtures = [
      {
        query: "RUN_REQUEST",
        url: "/docs/references/events#RUN_REQUEST",
      },
      {
        query: "submitWorkBySessionId",
        url: "/docs/references/api#submitWorkBySessionId",
      },
      {
        query: "you config init",
        url: "/docs/references/cli#you-config-init",
      },
      {
        query: "you.factory_session.get",
        url: "/docs/references/mcp-reference#you.factory_session.get",
      },
    ] as const;

    for (const locale of NON_DEFAULT_LOCALES) {
      for (const fixture of fixtures) {
        const results = await docsSearchApi.search(fixture.query, { locale });
        expect(results.some((result) => result.url === fixture.url)).toBe(true);
      }
    }
  });
});
