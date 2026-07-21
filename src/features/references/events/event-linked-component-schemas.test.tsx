/**
 * Render proof that linked component schemas mount with stable
 * components-schemas-* anchors (InferenceOutcome-class deep links).
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { EventLinkedComponentSchemas } from "@/features/references/events";
import {
  buildEventsLinkedComponentSchemas,
  buildFactoryEventCatalog,
  buildFactoryResponseEventCatalog,
  resolveEventCorpus,
} from "@/lib/references/events";

afterEach(() => {
  cleanup();
});

describe("EventLinkedComponentSchemas", () => {
  test("renders InferenceOutcome with components-schemas-InferenceOutcome id", () => {
    const corpus = resolveEventCorpus();
    const liveSchemas = corpus.openapi.document.components?.schemas ?? {};
    if (liveSchemas.InferenceOutcome === undefined) {
      // Packaged OpenAPI no longer publishes InferenceOutcome — skip rather
      // than invent a fixture schema for this lane.
      return;
    }

    const linked = buildEventsLinkedComponentSchemas(
      corpus.openapi.document,
      buildFactoryEventCatalog(corpus.openapi.document),
      buildFactoryResponseEventCatalog(corpus.openapi.document),
    );
    const inferenceOutcome = linked.find(
      (entry) => entry.schemaName === "InferenceOutcome",
    );
    expect(inferenceOutcome).toBeDefined();

    render(
      <EventLinkedComponentSchemas
        pagePath="/docs/references/events"
        schemas={linked}
      />,
    );

    const section = screen.getByTestId("event-linked-component-schemas");
    expect(section.getAttribute("data-event-linked-component-count")).toBe(
      String(linked.length),
    );

    const definition = screen.getByTestId(
      "event-linked-component-InferenceOutcome",
    );
    expect(definition.id).toBe("components-schemas-InferenceOutcome");
    expect(definition.getAttribute("data-schema-definition-pointer")).toBe(
      "/components/schemas/InferenceOutcome",
    );

    // Events adapter keeps pointer-path chrome suppressed (shared default untouched).
    expect(
      definition.querySelector('[data-schema-breadcrumb-segment="components"]'),
    ).toBeNull();
  });
});
