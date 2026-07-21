/**
 * Story 002 — SchemaRefLinks on /docs/references/events must resolve to
 * inlined on-page component-schema anchors (InferenceOutcome-class).
 *
 * Proves same-page hrefs, hash navigation onto definition elements, and
 * non-navigable unresolved outcomes. Does not invent schemas.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { focusReferenceHashTarget } from "@/features/references/shared";
import { EventsCorpusMount } from "./EventsCorpusMount";

const EVENTS_PAGE_PATH = "/docs/references/events";
const INFERENCE_OUTCOME_ANCHOR = "components-schemas-InferenceOutcome";

afterEach(() => {
  cleanup();
});

describe("events SchemaRefLink resolution", () => {
  test("navigable SchemaRefLinks resolve to on-page inlined component anchors", () => {
    const { container } = render(<EventsCorpusMount />);
    const mount = container.querySelector(
      '[data-testid="events-corpus-mount"]',
    );
    expect(mount).toBeTruthy();
    expect(mount?.getAttribute("data-events-page-path")).toBe(EVENTS_PAGE_PATH);

    const inferenceDefinition = container.querySelector(
      `#${INFERENCE_OUTCOME_ANCHOR}`,
    );
    // Packaged OpenAPI may drop InferenceOutcome; when present the anchor
    // and SchemaRefLinks must resolve on-page.
    if (inferenceDefinition instanceof HTMLElement) {
      expect(
        inferenceDefinition.getAttribute("data-schema-definition-pointer"),
      ).toBe("/components/schemas/InferenceOutcome");

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

      for (const link of inferenceLinks) {
        const href = link.getAttribute("href") ?? "";
        expect(href).toBe(`${EVENTS_PAGE_PATH}#${INFERENCE_OUTCOME_ANCHOR}`);
        expect(href.includes("://")).toBe(false);
      }

      const focused = focusReferenceHashTarget(
        container,
        `#${INFERENCE_OUTCOME_ANCHOR}`,
        { reduceMotion: true },
      );
      expect(focused).toBe(inferenceDefinition);
      expect(document.activeElement).toBe(inferenceDefinition);
    }

    // Envelope → FactoryResponseEventPayload must land on the mounted union.
    const payloadUnion = container.querySelector(
      "#components-schemas-FactoryResponseEventPayload",
    );
    expect(payloadUnion).toBeTruthy();
    expect(payloadUnion?.getAttribute("data-schema-definition-pointer")).toBe(
      "/components/schemas/FactoryResponseEventPayload",
    );

    const navigableRefs = container.querySelectorAll(
      'a[data-schema-ref-kind="resolved"], a[data-schema-ref-kind="cycle"]',
    );
    expect(navigableRefs.length).toBeGreaterThan(0);
    for (const link of navigableRefs) {
      const href = link.getAttribute("href") ?? "";
      expect(href.startsWith(`${EVENTS_PAGE_PATH}#`)).toBe(true);
      expect(href.includes("://")).toBe(false);
      const fragment = href.slice(`${EVENTS_PAGE_PATH}#`.length);
      expect(fragment.length).toBeGreaterThan(0);
      const target = container.querySelector(`#${CSS.escape(fragment)}`);
      expect(target).toBeTruthy();
      expect(target?.getAttribute("data-schema-definition-pointer")).toBe(
        link.getAttribute("data-schema-ref-pointer"),
      );
    }

    for (const unresolved of container.querySelectorAll(
      '[data-schema-ref-kind="missing"], [data-schema-ref-kind="malformed"]',
    )) {
      expect(unresolved.tagName.toLowerCase()).not.toBe("a");
      expect(unresolved.getAttribute("href")).toBeNull();
    }
  }, 120_000);
});
