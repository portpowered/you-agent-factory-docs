import { describe, expect, test } from "bun:test";
import { loadSchemaVerificationPackageModel } from "@/lib/references/load-schema-verification-models";
import { anchorForIdentity } from "@/lib/references/reference-anchor-registry";
import {
  buildSchemaPackageSearchDocuments,
  loadSchemaReferenceSearchShapes,
  SCHEMA_REFERENCE_PAGE_PATHS,
  SCHEMA_SEARCH_DOCUMENT_TAGS,
} from "./build-schema-reference-search-documents";
import { REFERENCE_SEARCH_DOCUMENT_KIND } from "./factory-search-kinds";

describe("buildSchemaPackageSearchDocuments", () => {
  test("indexes factory definitions and addressable fields on the factory-schema page", () => {
    const model = loadSchemaVerificationPackageModel("schemas/factory");
    const result = buildSchemaPackageSearchDocuments(model);

    expect(result.pagePath).toBe(
      SCHEMA_REFERENCE_PAGE_PATHS["schemas/factory"],
    );
    expect(result.documents.length).toBeGreaterThan(0);

    const workersField = result.documents.find(
      (document) =>
        document.title === "workers" &&
        document.tags.includes(SCHEMA_SEARCH_DOCUMENT_TAGS.field),
    );
    expect(workersField).toBeDefined();
    expect(workersField?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
    expect(
      workersField?.url.startsWith("/docs/references/factory-schema#"),
    ).toBe(true);
    expect(workersField?.url).toBe(
      `/docs/references/factory-schema#${workersField?.anchor}`,
    );
    expect(workersField?.url.includes("/docs/references/schema#")).toBe(false);

    const rootPointer = model.root.address.pointer;
    const rootDefinition = result.documents.find(
      (document) =>
        document.anchor === anchorForIdentity("schema-pointer", rootPointer) &&
        document.tags.includes(SCHEMA_SEARCH_DOCUMENT_TAGS.definition),
    );
    expect(rootDefinition).toBeDefined();
    expect(rootDefinition?.url).toBe(
      `/docs/references/factory-schema#${rootDefinition?.anchor}`,
    );
  });

  test("uses per-schema owning pages for you-config and mock-workers", () => {
    const corpus = loadSchemaReferenceSearchShapes();
    expect(corpus.packages).toHaveLength(3);

    const bySubpath = new Map(
      corpus.packages.map((entry) => [entry.subpath, entry]),
    );
    expect(bySubpath.get("schemas/factory")?.pagePath).toBe(
      "/docs/references/factory-schema",
    );
    expect(bySubpath.get("schemas/you-config")?.pagePath).toBe(
      "/docs/references/you-config-schema",
    );
    expect(bySubpath.get("schemas/mock-workers")?.pagePath).toBe(
      "/docs/references/mock-workers-schema",
    );

    for (const document of corpus.documents) {
      expect(document.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(document.family).toBe("schema");
      expect(document.url.includes("#")).toBe(true);
      expect(document.url.startsWith("/docs/references/schema#")).toBe(false);
      expect(
        document.url.startsWith("/docs/references/factory-schema#") ||
          document.url.startsWith("/docs/references/you-config-schema#") ||
          document.url.startsWith("/docs/references/mock-workers-schema#"),
      ).toBe(true);
    }
  });
});
