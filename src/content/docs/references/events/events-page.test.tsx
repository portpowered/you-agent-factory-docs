/**
 * Page-owned behavioral coverage for /docs/references/events.
 *
 * Proves published-route success and non-success outcomes, hybrid ownership
 * markers, and no-live-connection safety markers. Does not scan renderer
 * source trees, enforce global registration inventories, or re-test W09
 * inventory-drift logic.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import {
  isLocalDocsCatchAllSlug,
  loadLocalDocsPage,
  parseLocalDocsPageRef,
} from "@/lib/content/local-docs-page";
import {
  EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES,
  EVENT_RECONNECT_CURSOR_PARAM_NAMES,
  EVENT_STREAM_SAFETY,
  LOCKED_EVENT_STREAM_PLACEMENT,
  type SseStaticExamplesCorpus,
} from "@/lib/references/events";
import { source } from "@/lib/source";
import {
  EventsCorpusMountView,
  type ResolvedCorpusMount,
} from "./EventsCorpusMount";

const PAGE_OWNED_SSE_FIXTURE: SseStaticExamplesCorpus = {
  examples: [
    {
      id: "frame-example",
      kind: "sse-frame",
      title: "Static frame",
      description: "Wire-shape fixture only.",
      language: "text",
      code: "id: 1\nevent: factory\ndata: {}\n\n",
      origin: "illustrative-static-fixture",
      originLabel: "Illustrative static fixture",
      includesSseWireFields: true,
    },
    {
      id: "reconnect-example",
      kind: "reconnect-request",
      title: "Static reconnect",
      description: "No live EventSource.",
      language: "http",
      code: "GET /factory-sessions/{session_id}/events?after_event_id=42\n",
      origin: "illustrative-static-fixture",
      originLabel: "Illustrative static fixture",
    },
  ],
  safety: EVENT_STREAM_SAFETY,
  anchors: {
    section: "event-sse-static-examples",
    frame: "event-sse-frame-example",
    reconnect: "event-sse-reconnect-example",
    jsonProbe: "event-sse-json-reconnect-probe-example",
  },
};

const PAGE_RENDER_TIMEOUT_MS = 60_000;

describe("events reference page published-route states", () => {
  afterEach(() => {
    cleanup();
  });

  test("parses references local-docs refs for the events page", () => {
    expect(parseLocalDocsPageRef(["references", "events"])).toEqual({
      section: "references",
      slug: "events",
    });
    expect(isLocalDocsCatchAllSlug(["references", "events"])).toBe(true);
    expect(parseLocalDocsPageRef(["unknown", "events"])).toBeNull();
  });

  test(
    "success corpus render presents EventsSurface success state on the published route",
    async () => {
      const fumadocsPage = source.getPage(["references", "events"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/references/events");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: "events",
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe("reference.events");
      expect(loadedPage.messages.title).toBe("Events");
      expect(loadedPage.messages.description).toMatch(
        /FactoryEvent and FactoryResponseEvent/i,
      );
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      // Intro chrome stripped: no What It Covers / Key Concepts messages and
      // empty openingSummary so DocsOpeningSummary mounts nothing (MCP #156).
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(String(loadedPage.messages.openingSummary ?? "").trim()).toBe("");

      const eventCorpus = String(
        loadedPage.messages.sections?.eventCorpus?.body ?? "",
      );
      expect(eventCorpus).toMatch(/packaged OpenAPI/i);
      expect(eventCorpus).toMatch(/three stream operations/i);
      expect(eventCorpus).toMatch(/FactoryEvent envelope/i);
      expect(eventCorpus).toMatch(/FactoryResponseEvent envelope/i);
      expect(eventCorpus).toMatch(/reconnect cursor precedence/i);
      expect(eventCorpus).toMatch(/JSON reconnect-probe/i);
      expect(eventCorpus).toMatch(/static SSE frame examples/i);
      expect(eventCorpus).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.related).toBeUndefined();
      expect(loadedPage.messages.sections?.tags).toBeUndefined();
      expect(loadedPage.messages.sections?.references).toBeUndefined();
      expect(loadedPage.messages.links).toBeUndefined();

      render(
        <main>
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            {loadedPage.content}
          </DocsPageProviders>
        </main>,
      );

      expect(
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(
        screen.getByRole("heading", { name: "Event Corpus" }),
      ).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
      expect(document.getElementById("related")).toBeNull();
      expect(document.getElementById("what-it-covers")).toBeNull();
      expect(document.getElementById("key-concepts")).toBeNull();
      expect(document.getElementById("event-corpus")).toBeTruthy();
      expect(screen.queryByTestId("folded-summary")).toBeNull();
      expect(
        document.querySelector('[data-opening-summary="folded"]'),
      ).toBeNull();

      const mount = screen.getByTestId("events-corpus-mount");
      expect(mount.getAttribute("data-events-page-path")).toBe(
        "/docs/references/events",
      );

      const surface = screen.getByTestId("events-surface");
      expect(surface.getAttribute("data-events-status")).toBe("success");
      expect(surface.getAttribute("data-events-ownership")).toBe(
        "w09-production",
      );
      expect(surface.getAttribute("data-events-placement")).toBe(
        LOCKED_EVENT_STREAM_PLACEMENT,
      );
      expect(surface.getAttribute("data-events-asyncapi-permanent-pin")).toBe(
        "false",
      );

      const operations = screen.getByTestId("event-stream-operations-list");
      expect(operations.getAttribute("data-event-stream-count")).toBe("3");
      expect(
        screen.getByText("Canonical session-scoped FactoryEvent stream"),
      ).toBeTruthy();
      expect(
        screen.getByText("Ephemeral FactoryResponseEvent stream"),
      ).toBeTruthy();
      expect(
        screen.getByText(
          "Compatibility-only process-global FactoryEvent stream",
        ),
      ).toBeTruthy();
      const operationsQueries = within(operations);
      expect(
        operationsQueries.getByText("/factory-sessions/{session_id}/events"),
      ).toBeTruthy();
      expect(
        operationsQueries.getByText(
          "/factory-sessions/{session_id}/response-events",
        ),
      ).toBeTruthy();
      expect(operationsQueries.getByText("/events")).toBeTruthy();

      const factoryEventCatalog = screen.getByTestId(
        "factory-event-catalog-section",
      );
      expect(factoryEventCatalog.getAttribute("data-event-catalog")).toBe(
        "FactoryEvent",
      );
      expect(
        Number(
          factoryEventCatalog.getAttribute("data-event-catalog-mapping-count"),
        ),
      ).toBeGreaterThan(0);

      // Catalog polish: short label, envelope components, examples, single
      // field listing, and no verbose OpenAPI pointer-path chrome.
      const factoryEventQueries = within(factoryEventCatalog);
      expect(
        factoryEventQueries.getAllByText(/event catalog/i).length,
      ).toBeGreaterThan(0);
      expect(
        factoryEventQueries.queryByText(
          /Payload only — not a complete FactoryEvent envelope/i,
        ),
      ).toBeNull();
      expect(
        factoryEventQueries.getByTestId("event-envelope-json-example"),
      ).toBeTruthy();
      expect(
        factoryEventQueries.getByTestId("event-envelope-components"),
      ).toBeTruthy();
      expect(
        factoryEventQueries.getByTestId(
          "event-envelope-component-FactoryEventType",
        ),
      ).toBeTruthy();
      expect(
        factoryEventQueries.getByTestId(
          "event-envelope-component-FactoryEventContext",
        ),
      ).toBeTruthy();
      expect(
        factoryEventQueries.getAllByTestId("event-payload-json-example").length,
      ).toBeGreaterThan(0);
      const factoryEnvelopeFields = factoryEventQueries.getByLabelText(
        "Fields for FactoryEvent",
      );
      for (const field of [
        "schemaVersion",
        "id",
        "type",
        "context",
        "payload",
      ]) {
        expect(
          factoryEnvelopeFields.querySelectorAll(
            `[data-schema-field-path="${field}"]`,
          ).length,
        ).toBe(1);
      }
      expect(factoryEventCatalog.textContent ?? "").not.toMatch(
        /components\/schemas\/.*\/properties\//,
      );
      expect(
        factoryEventCatalog.querySelectorAll(
          '[data-schema-breadcrumb-segment="components"]',
        ).length,
      ).toBe(0);

      const factoryResponseCatalog = screen.getByTestId(
        "factory-response-event-catalog-section",
      );
      expect(factoryResponseCatalog.getAttribute("data-event-catalog")).toBe(
        "FactoryResponseEvent",
      );
      expect(
        factoryResponseCatalog.getAttribute("data-event-cartesian-valid"),
      ).toBe("false");
      expect(factoryResponseCatalog.getAttribute("data-event-ephemeral")).toBe(
        "true",
      );
      expect(
        Number(
          factoryResponseCatalog.getAttribute(
            "data-event-catalog-payload-count",
          ),
        ),
      ).toBeGreaterThan(0);

      const factoryResponseQueries = within(factoryResponseCatalog);
      expect(
        factoryResponseQueries.getAllByText(/event catalog/i).length,
      ).toBeGreaterThan(0);
      expect(
        factoryResponseQueries.queryByText(
          /Payload only — ephemeral; not a complete FactoryResponseEvent envelope/i,
        ),
      ).toBeNull();
      expect(
        factoryResponseQueries.getByTestId("event-envelope-json-example"),
      ).toBeTruthy();
      expect(
        factoryResponseQueries.getByTestId(
          "response-event-kind-schema-definition",
        ),
      ).toBeTruthy();
      expect(
        factoryResponseQueries.getByTestId(
          "response-event-phase-schema-definition",
        ),
      ).toBeTruthy();
      expect(
        factoryResponseQueries.getByTestId(
          "response-event-provenance-schema-definition",
        ),
      ).toBeTruthy();
      expect(
        factoryResponseQueries.getAllByTestId("event-payload-json-example")
          .length,
      ).toBeGreaterThan(0);
      const responseEnvelopeFields = factoryResponseQueries.getByLabelText(
        "Fields for FactoryResponseEvent",
      );
      for (const field of [
        "schemaVersion",
        "eventId",
        "sequence",
        "kind",
        "phase",
        "provenance",
        "payload",
      ]) {
        expect(
          responseEnvelopeFields.querySelectorAll(
            `[data-schema-field-path="${field}"]`,
          ).length,
        ).toBe(1);
      }
      expect(factoryResponseCatalog.textContent ?? "").not.toMatch(
        /components\/schemas\/.*\/properties\//,
      );
      expect(
        factoryResponseCatalog.querySelectorAll(
          '[data-schema-breadcrumb-segment="components"]',
        ).length,
      ).toBe(0);

      const reconnectLifecycle = screen.getByTestId(
        "event-reconnect-lifecycle-section",
      );
      expect(reconnectLifecycle).toBeTruthy();

      const reconnectContract = screen.getByTestId("event-reconnect-contract");
      expect(
        reconnectContract.getAttribute("data-event-reconnect-precedence"),
      ).toBe("after_event_id-wins-when-both-present");
      for (const name of EVENT_RECONNECT_CURSOR_PARAM_NAMES) {
        expect(
          reconnectContract.querySelector(
            `[data-event-reconnect-cursor-param="${name}"]`,
          ),
        ).toBeTruthy();
      }

      const identity = screen.getByTestId("event-identity-handshake");
      expect(
        identity.getAttribute("data-event-stream-generation-invalidates"),
      ).toBe("true");
      for (const name of EVENT_IDENTITY_HANDSHAKE_HEADER_NAMES) {
        expect(
          identity.querySelector(
            `[data-event-identity-handshake-header="${name}"]`,
          ),
        ).toBeTruthy();
      }

      const lifecycle = screen.getByTestId("event-stream-lifecycle");
      expect(lifecycle.getAttribute("data-event-stream-gap-kind")).toBe(
        "STREAM_GAP",
      );
      expect(
        lifecycle.querySelector("[data-event-lifecycle-retained]")?.textContent,
      ).toMatch(/retained history/i);
      expect(
        lifecycle.querySelector("[data-event-lifecycle-keepalive]")
          ?.textContent,
      ).toMatch(/keep-alive/i);
      expect(
        lifecycle.querySelector("[data-event-lifecycle-gap]")?.textContent,
      ).toContain("STREAM_GAP");
      expect(
        lifecycle.querySelector("[data-event-lifecycle-stale-cursor]")
          ?.textContent,
      ).toMatch(/CURSOR_STALE|stale/i);

      const jsonProbe = screen.getByTestId("event-json-reconnect-probe");
      expect(
        jsonProbe.getAttribute("data-event-json-reconnect-recovery-schema"),
      ).toBe("FactorySessionEventStreamRecovery");
      expect(
        jsonProbe.getAttribute("data-event-http-transport-ownership"),
      ).toBe("api-operation-page");

      const sseExamples = screen.getByTestId("sse-static-examples-section");
      expect(sseExamples.getAttribute("data-sse-live-connection")).toBe(
        "false",
      );
      expect(sseExamples.getAttribute("data-sse-proxy")).toBe("false");
      expect(screen.getAllByTestId("sse-frame-example").length).toBeGreaterThan(
        0,
      );
      expect(
        screen.getAllByTestId("sse-reconnect-example").length,
      ).toBeGreaterThan(0);

      // Body markers retargeted to corpus / catalog / reconnect surface (not
      // removed Key Concepts intro copy such as "Hybrid placement").
      const bodyText = document.body.textContent ?? "";
      expect(bodyText).toMatch(/FactoryEvent/i);
      expect(bodyText).toMatch(/FactoryResponseEvent/i);
      expect(bodyText).toMatch(/never preferred/i);
      expect(bodyText).toMatch(/Reconnect cursors/i);
      expect(bodyText).toMatch(/JSON reconnect probe/i);
      expect(bodyText).toMatch(/Static SSE frame and reconnect examples/i);
      expect(bodyText).toMatch(/event catalog/i);
      expect(bodyText).not.toMatch(/Model Atlas/i);
      expect(bodyText).not.toMatch(/Non-production events renderer harness/i);
      expect(bodyText).not.toMatch(/What It Covers/i);
      expect(bodyText).not.toMatch(/Key Concepts/i);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test("empty corpus mount shows accessible EventsStatus empty messaging", () => {
    const resolved: ResolvedCorpusMount = {
      status: "empty",
      statusTitle: "Empty event corpus",
      statusMessage:
        "No FactoryEvent or FactoryResponseEvent stream operations were published for this artifact.",
      summaries: [],
    };

    render(<EventsCorpusMountView resolved={resolved} />);

    const mount = screen.getByTestId("events-corpus-mount");
    expect(mount.getAttribute("data-events-page-path")).toBe(
      "/docs/references/events",
    );

    const status = screen.getByTestId("events-status");
    expect(status.getAttribute("data-events-status")).toBe("empty");
    expect(status.getAttribute("role")).toBe("status");
    expect(
      screen.getByRole("status", { name: "Empty event corpus" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "No FactoryEvent or FactoryResponseEvent stream operations were published for this artifact.",
      ),
    ).toBeTruthy();

    expect(screen.queryByTestId("event-stream-operations-list")).toBeNull();
    expect(screen.queryByTestId("factory-event-catalog-section")).toBeNull();
    expect(
      screen.queryByTestId("factory-response-event-catalog-section"),
    ).toBeNull();
    expect(
      screen.queryByTestId("event-reconnect-lifecycle-section"),
    ).toBeNull();
    expect(screen.queryByTestId("sse-static-examples-section")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/^\s*$/);
  });

  test("error corpus mount shows accessible EventsStatus alert messaging", () => {
    const resolved: ResolvedCorpusMount = {
      status: "error",
      statusTitle: "Corpus error",
      statusMessage: "OpenAPI resolution rejected the event corpus.",
      summaries: [],
    };

    render(<EventsCorpusMountView resolved={resolved} />);

    const mount = screen.getByTestId("events-corpus-mount");
    expect(mount.getAttribute("data-events-page-path")).toBe(
      "/docs/references/events",
    );

    const status = screen.getByTestId("events-status");
    expect(status.getAttribute("data-events-status")).toBe("error");
    expect(status.getAttribute("role")).toBe("alert");
    expect(screen.getByRole("alert", { name: "Corpus error" })).toBeTruthy();
    expect(
      screen.getByText("OpenAPI resolution rejected the event corpus."),
    ).toBeTruthy();

    expect(screen.queryByTestId("event-stream-operations-list")).toBeNull();
    expect(screen.queryByTestId("sse-static-examples-section")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/^\s*$/);
  });

  test("hybrid ownership and no-live-connection markers stay page-owned", () => {
    const resolved: ResolvedCorpusMount = {
      status: "success",
      summaries: [],
      sseStaticExamples: PAGE_OWNED_SSE_FIXTURE,
    };

    render(<EventsCorpusMountView resolved={resolved} />);

    const surface = screen.getByTestId("events-surface");
    expect(surface.getAttribute("data-events-status")).toBe("success");
    expect(surface.getAttribute("data-events-ownership")).toBe(
      "w09-production",
    );
    expect(surface.getAttribute("data-events-placement")).toBe(
      LOCKED_EVENT_STREAM_PLACEMENT,
    );
    expect(surface.getAttribute("data-events-asyncapi-permanent-pin")).toBe(
      "false",
    );

    const sseExamples = screen.getByTestId("sse-static-examples-section");
    expect(sseExamples.getAttribute("data-sse-live-connection")).toBe("false");
    expect(sseExamples.getAttribute("data-sse-proxy")).toBe("false");
    expect(screen.getByTestId("sse-frame-example")).toBeTruthy();
    expect(screen.getByTestId("sse-reconnect-example")).toBeTruthy();
  });
});
