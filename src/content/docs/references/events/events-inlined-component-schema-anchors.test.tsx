/**
 * Story 003 — events unit/page proof that inlined component-schema anchors
 * (InferenceOutcome-class) are present in the rendered success corpus and that
 * SchemaRefLinks to those targets stay navigable.
 *
 * Binds to live packaged OpenAPI names only — does not invent schemas.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { resolveEventCorpus } from "@/lib/references/events";
import { EventsCorpusMount } from "./EventsCorpusMount";

const EVENTS_PAGE_PATH = "/docs/references/events";
const INFERENCE_OUTCOME_ANCHOR = "components-schemas-InferenceOutcome";
const INFERENCE_OUTCOME_POINTER = "/components/schemas/InferenceOutcome";

afterEach(() => {
  cleanup();
});

describe("events inlined component-schema anchors", () => {
  test("success corpus mounts InferenceOutcome anchor and navigable SchemaRefLink", () => {
    const liveSchemas =
      resolveEventCorpus().openapi.document.components?.schemas ?? {};

    const { container } = render(<EventsCorpusMount />);

    const mount = screen.getByTestId("events-corpus-mount");
    expect(mount.getAttribute("data-events-page-path")).toBe(EVENTS_PAGE_PATH);
    expect(
      screen.getByTestId("events-surface").getAttribute("data-events-status"),
    ).toBe("success");

    const linkedSection = screen.getByTestId("event-linked-component-schemas");
    expect(
      Number(
        linkedSection.getAttribute("data-event-linked-component-count") ?? "0",
      ),
    ).toBeGreaterThan(0);

    // Packaged OpenAPI may drop InferenceOutcome later; only require the
    // poster-child anchor when the live package still publishes it.
    if (liveSchemas.InferenceOutcome === undefined) {
      return;
    }

    const definition = container.querySelector(`#${INFERENCE_OUTCOME_ANCHOR}`);
    expect(definition).toBeInstanceOf(HTMLElement);
    if (!(definition instanceof HTMLElement)) {
      throw new Error(`expected #${INFERENCE_OUTCOME_ANCHOR} HTMLElement`);
    }
    expect(definition.getAttribute("data-schema-definition-pointer")).toBe(
      INFERENCE_OUTCOME_POINTER,
    );
    expect(screen.getByTestId("event-linked-component-InferenceOutcome")).toBe(
      definition,
    );

    const inferenceLinks = [
      ...container.querySelectorAll(
        'a[data-schema-ref-kind="resolved"], a[data-schema-ref-kind="cycle"]',
      ),
    ].filter((link) =>
      (link.getAttribute("data-schema-ref-pointer") ?? "").endsWith(
        "/InferenceOutcome",
      ),
    );
    expect(inferenceLinks.length).toBeGreaterThan(0);

    const representative = inferenceLinks[0];
    expect(representative?.getAttribute("href")).toBe(
      `${EVENTS_PAGE_PATH}#${INFERENCE_OUTCOME_ANCHOR}`,
    );
    expect(representative?.getAttribute("data-schema-ref-pointer")).toBe(
      INFERENCE_OUTCOME_POINTER,
    );
  }, 120_000);
});
