import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  EventIdentityHandshake,
  EventJsonReconnectProbe,
  EventReconnectContract,
  EventReconnectLifecycleSection,
  EventStreamLifecycle,
  EventsVerificationHarness,
} from "@/components/references/events";
import {
  buildEventIdentityHandshake,
  buildEventJsonReconnectProbe,
  buildEventReconnectContract,
  buildEventReconnectLifecycleCorpus,
  buildEventStreamLifecycle,
  EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES,
  EVENT_JSON_RECONNECT_PROBE_OUTCOME_BASELINE,
  EVENT_RECONNECT_CANONICAL_PATH,
  EVENT_RECONNECT_CURSOR_PARAM_NAMES,
  EVENT_STREAM_LIFECYCLE_RESPONSE_GAP_KIND,
  EventReconnectLifecycleError,
  resolveEventCorpus,
} from "@/lib/references/events";

afterEach(() => {
  cleanup();
});

describe("buildEventReconnectLifecycleCorpus", () => {
  test("builds reconnect / identity / lifecycle / JSON probe from packaged OpenAPI", () => {
    const corpus = resolveEventCorpus();
    const lifecycle = buildEventReconnectLifecycleCorpus(
      corpus.openapi.document,
    );

    expect(lifecycle.reconnect.streamPath).toBe(EVENT_RECONNECT_CANONICAL_PATH);
    expect(lifecycle.reconnect.precedenceRule).toBe(
      "after_event_id-wins-when-both-present",
    );
    expect(lifecycle.reconnect.omitBothStartsFromRetainedHistoryStart).toBe(
      true,
    );
    expect(lifecycle.reconnect.cursorParameters.map((p) => p.name)).toEqual([
      ...EVENT_RECONNECT_CURSOR_PARAM_NAMES,
    ]);
    expect(lifecycle.reconnect.precedenceSummary).toContain(
      "after_event_id wins",
    );
    expect(lifecycle.reconnect.sessionSequenceFallbackSummary).toContain(
      "sessionSequence",
    );

    expect(lifecycle.identity.streamGenerationInvalidatesPriorCursors).toBe(
      true,
    );
    expect(lifecycle.identity.headers.map((h) => h.name)).toEqual([
      ...EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES,
    ]);
    expect(lifecycle.identity.summary).toContain("streamGenerationId");

    expect(lifecycle.lifecycle.responseEventStreamGapKind).toBe(
      EVENT_STREAM_LIFECYCLE_RESPONSE_GAP_KIND,
    );
    expect(
      lifecycle.lifecycle.retainedHistoryThenLiveSummary.length,
    ).toBeGreaterThan(0);
    expect(lifecycle.lifecycle.keepaliveWaitingStateSummary).toContain(
      "keep-alive",
    );
    expect(lifecycle.lifecycle.gapBehaviorSummary).toContain("STREAM_GAP");
    expect(lifecycle.lifecycle.staleCursorRecoverySummary).toContain(
      "CURSOR_STALE",
    );

    expect(lifecycle.jsonReconnectProbe.acceptMediaType).toBe(
      "application/json",
    );
    expect(lifecycle.jsonReconnectProbe.recoverySchemaName).toBe(
      "FactorySessionEventStreamRecovery",
    );
    expect(lifecycle.jsonReconnectProbe.httpTransportOwnership).toBe(
      "api-operation-page",
    );
    for (const outcome of EVENT_JSON_RECONNECT_PROBE_OUTCOME_BASELINE) {
      expect(lifecycle.jsonReconnectProbe.outcomes).toContain(outcome);
    }
    expect(lifecycle.jsonReconnectProbe.retryFields.map((f) => f.name)).toEqual(
      expect.arrayContaining(["omitAfterEventId", "omitAfterSequence"]),
    );

    expect(lifecycle.anchors.reconnect).toBe("event-reconnect-contract");
    expect(lifecycle.anchors.identity).toBe("event-identity-handshake");
    expect(lifecycle.anchors.lifecycle).toBe("event-stream-lifecycle");
    expect(lifecycle.anchors.jsonReconnectProbe).toBe(
      "event-json-reconnect-probe",
    );
  });

  test("fails closed when canonical cursor parameters are missing", () => {
    expect(() =>
      buildEventReconnectContract({
        paths: {
          [EVENT_RECONNECT_CANONICAL_PATH]: {
            get: {
              operationId: "getEventsBySessionId",
              parameters: [],
              responses: { "200": { content: {} } },
            },
          },
        },
      }),
    ).toThrow(EventReconnectLifecycleError);
  });

  test("fails closed when JSON reconnect probe content is missing", () => {
    expect(() =>
      buildEventJsonReconnectProbe({
        paths: {
          [EVENT_RECONNECT_CANONICAL_PATH]: {
            get: {
              operationId: "getEventsBySessionId",
              responses: {
                "200": {
                  content: {
                    "text/event-stream": { schema: {} },
                  },
                },
              },
            },
          },
        },
        components: { schemas: {} },
      }),
    ).toThrow(EventReconnectLifecycleError);
  });

  test("fails closed when handshake headers are missing", () => {
    expect(() =>
      buildEventIdentityHandshake({
        paths: {
          [EVENT_RECONNECT_CANONICAL_PATH]: {
            get: {
              operationId: "getEventsBySessionId",
              responses: { "200": { headers: {} } },
            },
          },
        },
      }),
    ).toThrow(EventReconnectLifecycleError);
  });

  test("buildEventStreamLifecycle still returns summaries from sparse prose", () => {
    const lifecycle = buildEventStreamLifecycle({
      paths: {
        [EVENT_RECONNECT_CANONICAL_PATH]: {
          get: {
            operationId: "getEventsBySessionId",
            description: "minimal",
            responses: { "200": { description: "ok" } },
          },
        },
      },
    });
    expect(lifecycle.responseEventStreamGapKind).toBe("STREAM_GAP");
    expect(lifecycle.retainedHistoryThenLiveSummary.length).toBeGreaterThan(0);
  });
});

describe("Event reconnect lifecycle UI", () => {
  test("EventReconnectContract documents cursor precedence", () => {
    const corpus = resolveEventCorpus();
    const contract = buildEventReconnectContract(corpus.openapi.document);
    render(<EventReconnectContract contract={contract} />);

    const section = screen.getByTestId("event-reconnect-contract");
    expect(section.getAttribute("data-event-reconnect-precedence")).toBe(
      "after_event_id-wins-when-both-present",
    );
    expect(
      section.querySelector("[data-event-reconnect-precedence-summary]")
        ?.textContent,
    ).toContain("after_event_id wins");
    expect(
      section.querySelector(
        '[data-event-reconnect-cursor-param="after_event_id"]',
      ),
    ).toBeTruthy();
    expect(
      section.querySelector(
        '[data-event-reconnect-cursor-param="after_sequence"]',
      ),
    ).toBeTruthy();
  });

  test("EventIdentityHandshake documents headers and stream-generation invalidation", () => {
    const corpus = resolveEventCorpus();
    const handshake = buildEventIdentityHandshake(corpus.openapi.document);
    render(<EventIdentityHandshake handshake={handshake} />);

    const section = screen.getByTestId("event-identity-handshake");
    expect(
      section.getAttribute("data-event-stream-generation-invalidates"),
    ).toBe("true");
    for (const name of EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES) {
      expect(
        section.querySelector(
          `[data-event-identity-handshake-header="${name}"]`,
        ),
      ).toBeTruthy();
    }
    expect(
      section.querySelector("[data-event-stream-generation-invalidation]")
        ?.textContent,
    ).toMatch(/invalidates prior cursors/i);
  });

  test("EventStreamLifecycle documents retained history, keepalive, STREAM_GAP, stale cursor", () => {
    const corpus = resolveEventCorpus();
    const lifecycle = buildEventStreamLifecycle(corpus.openapi.document);
    render(<EventStreamLifecycle lifecycle={lifecycle} />);

    const section = screen.getByTestId("event-stream-lifecycle");
    expect(section.getAttribute("data-event-stream-gap-kind")).toBe(
      "STREAM_GAP",
    );
    expect(
      section.querySelector("[data-event-lifecycle-retained]")?.textContent,
    ).toMatch(/retained history/i);
    expect(
      section.querySelector("[data-event-lifecycle-keepalive]")?.textContent,
    ).toMatch(/keep-alive/i);
    expect(
      section.querySelector("[data-event-lifecycle-gap]")?.textContent,
    ).toContain("STREAM_GAP");
    expect(
      section.querySelector("[data-event-lifecycle-stale-cursor]")?.textContent,
    ).toMatch(/CURSOR_STALE|stale/i);
  });

  test("EventJsonReconnectProbe documents recovery outcomes without owning API OpenAPI UI", () => {
    const corpus = resolveEventCorpus();
    const probe = buildEventJsonReconnectProbe(corpus.openapi.document);
    render(<EventJsonReconnectProbe probe={probe} />);

    const section = screen.getByTestId("event-json-reconnect-probe");
    expect(section.getAttribute("data-event-http-transport-ownership")).toBe(
      "api-operation-page",
    );
    expect(
      section.querySelector(
        '[data-event-json-reconnect-outcome="STREAM_READY"]',
      ),
    ).toBeTruthy();
    expect(
      section.querySelector(
        '[data-event-json-reconnect-outcome="CURSOR_STALE"]',
      ),
    ).toBeTruthy();
    expect(
      section.querySelector(
        '[data-event-json-reconnect-outcome="UNKNOWN_SESSION"]',
      ),
    ).toBeTruthy();
    const transportSummary = screen.getByRole("link", {
      name: /API transport summary/i,
    });
    expect(transportSummary).toBeTruthy();
    expect(transportSummary.className).toContain("text-secondary");
    expect(transportSummary.className).toContain("underline-offset-4");
    expect(transportSummary.className).toContain("hover:underline");
    expect(transportSummary.className).not.toMatch(/\btext-primary\b/);
    expect(
      section.querySelector(
        '[data-event-json-reconnect-retry-field="omitAfterEventId"]',
      ),
    ).toBeTruthy();
  });

  test("EventReconnectLifecycleSection and harness compose all contracts", () => {
    const corpus = resolveEventCorpus();
    const lifecycle = buildEventReconnectLifecycleCorpus(
      corpus.openapi.document,
    );

    render(
      <EventsVerificationHarness
        reconnectLifecycle={lifecycle}
        summaries={[]}
      />,
    );

    expect(
      screen.getByTestId("event-reconnect-lifecycle-section"),
    ).toBeTruthy();
    expect(screen.getByTestId("event-reconnect-contract")).toBeTruthy();
    expect(screen.getByTestId("event-identity-handshake")).toBeTruthy();
    expect(screen.getByTestId("event-stream-lifecycle")).toBeTruthy();
    expect(screen.getByTestId("event-json-reconnect-probe")).toBeTruthy();

    cleanup();

    render(<EventReconnectLifecycleSection corpus={lifecycle} />);
    const composed = screen.getByTestId("event-reconnect-lifecycle-section");
    expect(
      within(composed).getByTestId("event-reconnect-contract"),
    ).toBeTruthy();
  });
});
