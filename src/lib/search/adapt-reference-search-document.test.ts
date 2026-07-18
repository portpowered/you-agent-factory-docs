import { describe, expect, test } from "bun:test";
import type { ReferenceSearchDocumentShape } from "@/lib/references/reference-search-projection";
import {
  adaptReferenceSearchShapesToSearchDocuments,
  adaptReferenceSearchShapeToSearchDocument,
  enrichReferenceItemAliases,
} from "./adapt-reference-search-document";
import { REFERENCE_SEARCH_DOCUMENT_KIND } from "./factory-search-kinds";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "./types";

function sampleShape(
  overrides: Partial<ReferenceSearchDocumentShape> = {},
): ReferenceSearchDocumentShape {
  return {
    id: "events:factory-event:session.created",
    kind: REFERENCE_SEARCH_DOCUMENT_KIND,
    family: "events",
    title: "session.created",
    description: "FactoryEvent.type session.created → SessionCreatedPayload",
    bodyText:
      "session.created\nFactoryEvent.type session.created → SessionCreatedPayload",
    aliases: ["SessionCreatedPayload"],
    tags: ["events", "factory-event-type"],
    url: "/docs/references/events#session.created",
    anchor: "session.created",
    relatedIds: [],
    source: {
      publicArtifactId: "events-openapi",
      pointer: "/components/schemas/FactoryEvent",
    },
    ...overrides,
  };
}

describe("enrichReferenceItemAliases", () => {
  test("includes title, anchor, and shape-provided common-name aliases", () => {
    expect(
      enrichReferenceItemAliases({
        title: "RUN_REQUEST",
        anchor: "RUN_REQUEST",
        aliases: [
          "RunRequestEventPayload",
          "#/components/schemas/RunRequestEventPayload",
        ],
      }),
    ).toEqual([
      "RUN_REQUEST",
      "RunRequestEventPayload",
      "#/components/schemas/RunRequestEventPayload",
    ]);
  });
});

describe("adaptReferenceSearchShapeToSearchDocument", () => {
  test("maps W04/W09 shape fields into a live Orama SearchDocument", () => {
    const document = adaptReferenceSearchShapeToSearchDocument(sampleShape());

    expect(document).toEqual({
      id: "events:factory-event:session.created",
      url: "/docs/references/events#session.created",
      kind: REFERENCE_SEARCH_DOCUMENT_KIND,
      title: "session.created",
      description: "FactoryEvent.type session.created → SessionCreatedPayload",
      bodyText:
        "session.created\nFactoryEvent.type session.created → SessionCreatedPayload",
      headings: ["session.created"],
      directAliases: ["session.created", "SessionCreatedPayload"],
      aliases: ["session.created", "SessionCreatedPayload"],
      tags: ["events", "factory-event-type"],
      relatedIds: [],
      facets: {
        kind: REFERENCE_SEARCH_DOCUMENT_KIND,
        tags: ["events", "factory-event-type"],
      },
      topology: { ...EMPTY_SEARCH_DOCUMENT_TOPOLOGY },
    });
  });

  test("coerces absent description to empty string and keeps fragment URL", () => {
    const document = adaptReferenceSearchShapeToSearchDocument(
      sampleShape({ description: undefined }),
    );

    expect(document.description).toBe("");
    expect(document.url).toBe("/docs/references/events#session.created");
    expect(document.url.includes("#")).toBe(true);
  });

  test("rejects shapes without a registry anchor fragment URL", () => {
    expect(() =>
      adaptReferenceSearchShapeToSearchDocument(
        sampleShape({
          url: "/docs/references/events",
          anchor: "session.created",
        }),
      ),
    ).toThrow(/registry anchor fragment/);
  });

  test("adapts many shapes", () => {
    const documents = adaptReferenceSearchShapesToSearchDocuments([
      sampleShape(),
      sampleShape({
        id: "events:factory-event:work.completed",
        title: "work.completed",
        url: "/docs/references/events#work.completed",
        anchor: "work.completed",
      }),
    ]);

    expect(documents).toHaveLength(2);
    expect(documents[1]?.url).toBe("/docs/references/events#work.completed");
  });
});
