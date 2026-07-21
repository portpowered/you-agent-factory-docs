import { describe, expect, test } from "bun:test";
import { projectReferenceItemToDisplay } from "./reference-display-projection";
import type { ReferenceItem } from "./reference-item";
import {
  createReferenceSearchDocumentBuilder,
  projectReferenceItemToSearchDocument,
  REFERENCE_FAMILY_PAGE_PATHS,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  ReferenceSearchDocumentBuilder,
  type ReferenceSearchDocumentShape,
  referenceAnchorUrl,
  referencePagePathForFamily,
} from "./reference-search-projection";

function sampleItem(overrides: Partial<ReferenceItem> = {}): ReferenceItem {
  return {
    id: "openapi.operation.submitWorkBySessionId",
    family: "api",
    title: "Submit work by session id",
    description: "Enqueue work for an existing session.",
    lifecycle: {
      state: "active",
      since: "0.0.0",
    },
    source: {
      publicArtifactId: "@you-agent-factory/api/openapi",
      pointer: "/paths/~1sessions~1{sessionId}~1work/post",
      path: "generated/openapi/openapi.yaml",
    },
    aliases: ["submitWorkBySessionId", "submit-work"],
    anchor: "submitWorkBySessionId",
    ...overrides,
  };
}

describe("referencePagePathForFamily / referenceAnchorUrl", () => {
  test("maps each family to a /docs/references/… page path", () => {
    expect(referencePagePathForFamily("api")).toBe("/docs/references/api");
    expect(referencePagePathForFamily("javascript")).toBe(
      "/docs/references/javascript-runtime",
    );
    expect(REFERENCE_FAMILY_PAGE_PATHS.cli).toBe("/docs/references/cli");
    expect(REFERENCE_FAMILY_PAGE_PATHS.mcp).toBe(
      "/docs/references/mcp-reference",
    );
    expect(REFERENCE_FAMILY_PAGE_PATHS.events).toBe("/docs/references/events");
  });

  test("builds owning-page fragment URLs", () => {
    expect(
      referenceAnchorUrl("/docs/references/api", "submitWorkBySessionId"),
    ).toBe("/docs/references/api#submitWorkBySessionId");
    expect(
      referenceAnchorUrl("/docs/references/api/", "#submitWorkBySessionId"),
    ).toBe("/docs/references/api#submitWorkBySessionId");
  });
});

describe("projectReferenceItemToSearchDocument", () => {
  test("builds one search-document shape with an owning-page anchor URL", () => {
    const item = sampleItem();
    const document = projectReferenceItemToSearchDocument(item);

    expect(document).toMatchObject({
      id: item.id,
      kind: REFERENCE_SEARCH_DOCUMENT_KIND,
      family: "api",
      title: "Submit work by session id",
      description: "Enqueue work for an existing session.",
      anchor: "submitWorkBySessionId",
      url: "/docs/references/api#submitWorkBySessionId",
      tags: ["api"],
    } satisfies Partial<ReferenceSearchDocumentShape>);
    expect(document.bodyText).toContain("Submit work by session id");
    expect(document.bodyText).toContain(
      "Enqueue work for an existing session.",
    );
    expect(document.bodyText).toContain("submitWorkBySessionId");
    expect(document.aliases).toEqual(item.aliases);
    expect(document.aliases).not.toBe(item.aliases);
    expect(document.source).toEqual(item.source);
    expect(document.source).not.toBe(item.source);
  });

  test("leaves missing descriptions absent rather than inventing copy", () => {
    const item = sampleItem();
    delete (item as { description?: string }).description;

    const document = projectReferenceItemToSearchDocument(item, {
      tags: ["operation"],
      extraBodyText: "POST /sessions/{sessionId}/work",
    });

    expect(document.description).toBeUndefined();
    expect(document.tags).toEqual(["api", "operation"]);
    expect(document.bodyText).toContain("POST /sessions/{sessionId}/work");
  });

  test("does not mutate the canonical item when the search doc is edited", () => {
    const item = sampleItem();
    const document = projectReferenceItemToSearchDocument(item);
    document.aliases.push("mutated");
    document.source.pointer = "/mutated";
    expect(item.aliases).toEqual(["submitWorkBySessionId", "submit-work"]);
    expect(item.source.pointer).toBe(
      "/paths/~1sessions~1{sessionId}~1work/post",
    );
  });
});

describe("ReferenceSearchDocumentBuilder", () => {
  test("builds one document per addressable item sharing a page", () => {
    const builder = createReferenceSearchDocumentBuilder();
    const items = [
      sampleItem(),
      sampleItem({
        id: "openapi.operation.getSession",
        title: "Get session",
        description: undefined,
        aliases: ["getSession"],
        anchor: "getSession",
      }),
    ];
    delete (items[1] as { description?: string }).description;

    const documents = builder.buildMany(items);

    expect(documents).toHaveLength(2);
    expect(documents[0]?.url).toBe(
      "/docs/references/api#submitWorkBySessionId",
    );
    expect(documents[1]?.url).toBe("/docs/references/api#getSession");
    expect(documents[1]?.description).toBeUndefined();
  });

  test("allows per-builder page path overrides without changing display types", () => {
    const builder = new ReferenceSearchDocumentBuilder({
      pagePathByFamily: { api: "/docs/references/custom-api" },
    });
    const document = builder.build(sampleItem());
    expect(document.url).toBe(
      "/docs/references/custom-api#submitWorkBySessionId",
    );

    // Display projection stays separately typed / shaped.
    const display = projectReferenceItemToDisplay(sampleItem());
    expect("url" in display).toBe(false);
    expect("bodyText" in display).toBe(false);
    expect("kind" in display).toBe(false);
    expect(display.anchor).toBe("submitWorkBySessionId");
  });
});
