/**
 * Prove linked-component schema splay collects InferenceOutcome-class nested
 * targets from packaged OpenAPI without inventing schemas or duplicating
 * already-rendered catalog roots.
 */

import { describe, expect, test } from "bun:test";
import { schemaPointerAnchor } from "@/features/references/schema";
import {
  buildEventsLinkedComponentSchemas,
  buildFactoryEventCatalog,
  buildFactoryResponseEventCatalog,
  eventsAlreadyRenderedComponentSchemaNames,
  resolveEventCorpus,
} from "@/lib/references/events";

describe("buildEventsLinkedComponentSchemas", () => {
  test("inlines nested linked component schemas from packaged OpenAPI", () => {
    const corpus = resolveEventCorpus();
    const factoryEventCatalog = buildFactoryEventCatalog(
      corpus.openapi.document,
    );
    const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );
    const alreadyRendered = new Set(
      eventsAlreadyRenderedComponentSchemaNames(
        factoryEventCatalog,
        factoryResponseEventCatalog,
      ),
    );
    const linked = buildEventsLinkedComponentSchemas(
      corpus.openapi.document,
      factoryEventCatalog,
      factoryResponseEventCatalog,
    );

    expect(linked.length).toBeGreaterThan(0);
    expect(linked.map((entry) => entry.schemaName)).toEqual(
      [...linked.map((entry) => entry.schemaName)].sort((a, b) =>
        a.localeCompare(b),
      ),
    );

    for (const entry of linked) {
      expect(alreadyRendered.has(entry.schemaName)).toBe(false);
      expect(
        corpus.openapi.document.components?.schemas?.[entry.schemaName],
      ).toBeDefined();
      expect(entry.schemaRef).toBe(`#/components/schemas/${entry.schemaName}`);
      expect(entry.address.pointer).toBe(
        `/components/schemas/${entry.schemaName}`,
      );
      expect(entry.schemaPointerAnchor).toBe(
        schemaPointerAnchor(entry.address.pointer),
      );
      expect(entry.definition.address.pointer).toBe(entry.address.pointer);
    }

    const liveSchemas = corpus.openapi.document.components?.schemas ?? {};
    if (liveSchemas.InferenceOutcome !== undefined) {
      const inferenceOutcome = linked.find(
        (entry) => entry.schemaName === "InferenceOutcome",
      );
      expect(inferenceOutcome).toBeDefined();
      expect(inferenceOutcome?.schemaPointerAnchor).toBe(
        "components-schemas-InferenceOutcome",
      );
    }
  });

  test("does not invent unpublished component schema names", () => {
    const corpus = resolveEventCorpus();
    const factoryEventCatalog = buildFactoryEventCatalog(
      corpus.openapi.document,
    );
    const factoryResponseEventCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );
    const liveNames = new Set(
      Object.keys(corpus.openapi.document.components?.schemas ?? {}),
    );
    const linked = buildEventsLinkedComponentSchemas(
      {
        components: {
          schemas: {
            ...corpus.openapi.document.components?.schemas,
          },
        },
      },
      factoryEventCatalog,
      factoryResponseEventCatalog,
    );

    for (const entry of linked) {
      expect(liveNames.has(entry.schemaName)).toBe(true);
    }
    expect(
      linked.some((entry) => entry.schemaName === "UnpublishedTodoSchema"),
    ).toBe(false);
  });
});
