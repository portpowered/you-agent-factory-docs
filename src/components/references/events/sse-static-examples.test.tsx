import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  EventsVerificationHarness,
  SseFrameExample,
  SseReconnectExample,
  SseStaticExamplesSection,
} from "@/components/references/events";
import {
  buildEventReconnectLifecycleCorpus,
  buildSseStaticExamplesCorpus,
  EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES,
  EVENT_RECONNECT_CURSOR_PARAM_NAMES,
  EVENT_STREAM_SAFETY,
  resolveEventCorpus,
  SSE_STATIC_EXAMPLE_ORIGIN,
  sseFrameExampleHasWireFields,
  sseReconnectExampleUsesContractNames,
  sseStaticFrameExamples,
  sseStaticReconnectExamples,
} from "@/lib/references/events";

afterEach(() => {
  cleanup();
});

function liveSseStaticCorpus() {
  const corpus = resolveEventCorpus();
  const reconnectLifecycle = buildEventReconnectLifecycleCorpus(
    corpus.openapi.document,
  );
  return {
    corpus,
    reconnectLifecycle,
    examples: buildSseStaticExamplesCorpus(
      corpus.openapi.document,
      reconnectLifecycle,
    ),
  };
}

describe("buildSseStaticExamplesCorpus", () => {
  test("builds frame + reconnect examples with safety contract and wire fields", () => {
    const { examples } = liveSseStaticCorpus();

    expect(examples.safety).toEqual(EVENT_STREAM_SAFETY);
    expect(examples.safety.opensLiveFactoryConnection).toBe(false);
    expect(examples.safety.addsProxyRoute).toBe(false);
    expect(examples.safety.proxyUrl).toBeUndefined();

    const frames = sseStaticFrameExamples(examples);
    expect(frames.length).toBeGreaterThanOrEqual(1);
    const factoryFrame = frames.find(
      (example) => example.id === "factory-event-sse-frame",
    );
    expect(factoryFrame).toBeDefined();
    expect(factoryFrame?.includesSseWireFields).toBe(true);
    expect(sseFrameExampleHasWireFields(factoryFrame?.code ?? "")).toBe(true);
    expect(factoryFrame?.origin).toBe(
      SSE_STATIC_EXAMPLE_ORIGIN.illustrativeStaticFixture,
    );
    expect(factoryFrame?.code).toContain("id:");
    expect(factoryFrame?.code).toContain("event:");
    expect(factoryFrame?.code).toContain("data:");
    expect(factoryFrame?.code).toContain("schemaVersion");
    expect(factoryFrame?.description.toLowerCase()).toContain("illustrative");

    const reconnects = sseStaticReconnectExamples(examples);
    expect(reconnects.length).toBeGreaterThanOrEqual(1);
    const reconnectRequest = reconnects.find(
      (example) => example.id === "canonical-sse-reconnect-request",
    );
    expect(reconnectRequest).toBeDefined();
    expect(
      sseReconnectExampleUsesContractNames(reconnectRequest?.code ?? ""),
    ).toBe(true);
    for (const name of EVENT_RECONNECT_CURSOR_PARAM_NAMES) {
      expect(reconnectRequest?.code).toContain(name);
    }
    for (const name of EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES) {
      expect(reconnectRequest?.code).toContain(name);
    }
    expect(reconnectRequest?.code).toContain("EventSource");

    const jsonProbe = reconnects.find(
      (example) => example.id === "json-reconnect-probe-response",
    );
    expect(jsonProbe).toBeDefined();
    expect(jsonProbe?.origin).toBe(SSE_STATIC_EXAMPLE_ORIGIN.openApiAuthored);
    expect(jsonProbe?.code).toContain("CURSOR_STALE");
    expect(jsonProbe?.code).toContain("omitAfterEventId");
  });
});

describe("SseFrameExample / SseReconnectExample UI", () => {
  test("renders accessible static frames via CodePanel without live connection markers", () => {
    const { examples } = liveSseStaticCorpus();
    const frame = sseStaticFrameExamples(examples).find(
      (example) => example.id === "factory-event-sse-frame",
    );
    expect(frame).toBeDefined();
    if (frame === undefined) {
      return;
    }

    render(<SseFrameExample example={frame} />);

    const article = screen.getByTestId("sse-frame-example");
    expect(article.getAttribute("data-sse-live-connection")).toBe("false");
    expect(article.getAttribute("data-sse-wire-fields")).toBe("id-event-data");
    expect(article.getAttribute("data-sse-example-origin")).toBe(
      "illustrative-static-fixture",
    );
    expect(screen.getByText(frame.title)).toBeTruthy();
    expect(screen.getByText("Illustrative static fixture")).toBeTruthy();
    const code = within(article).getByTestId(
      `sse-frame-example-code-${frame.id}`,
    );
    expect(code.textContent).toContain("id:");
    expect(code.textContent).toContain("event:");
    expect(code.textContent).toContain("data:");
  });

  test("renders reconnect example with contract cursor and handshake headers", () => {
    const { examples } = liveSseStaticCorpus();
    const reconnect = sseStaticReconnectExamples(examples).find(
      (example) => example.id === "canonical-sse-reconnect-request",
    );
    expect(reconnect).toBeDefined();
    if (reconnect === undefined) {
      return;
    }

    render(<SseReconnectExample example={reconnect} />);

    const article = screen.getByTestId("sse-reconnect-example");
    expect(article.getAttribute("data-sse-live-connection")).toBe("false");
    const code = within(article).getByTestId(
      `sse-reconnect-example-code-${reconnect.id}`,
    );
    expect(code.textContent).toContain("after_event_id");
    expect(code.textContent).toContain(
      "X-Factory-Session-Stream-Generation-Id",
    );
  });

  test("section composes frames + reconnects and marks no live connection / proxy", () => {
    const { examples } = liveSseStaticCorpus();
    render(<SseStaticExamplesSection corpus={examples} />);

    const section = screen.getByTestId("sse-static-examples-section");
    expect(section.getAttribute("data-sse-live-connection")).toBe("false");
    expect(section.getAttribute("data-sse-proxy")).toBe("false");
    expect(
      screen.getByText("Static SSE frame and reconnect examples"),
    ).toBeTruthy();
    expect(
      screen.getAllByTestId("sse-frame-example").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByTestId("sse-reconnect-example").length,
    ).toBeGreaterThanOrEqual(1);
  });

  test("harness includes static SSE examples when provided", () => {
    const { examples } = liveSseStaticCorpus();
    render(
      <EventsVerificationHarness sseStaticExamples={examples} summaries={[]} />,
    );

    expect(screen.getByTestId("sse-static-examples-section")).toBeTruthy();
    expect(
      screen.getByText("Static SSE frame and reconnect examples"),
    ).toBeTruthy();
  });
});
