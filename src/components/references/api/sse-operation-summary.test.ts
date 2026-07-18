import { describe, expect, test } from "bun:test";
import {
  API_EVENTS_REFERENCE_PAGE_PATH,
  apiSseEventsCatalogLinkForSchemaRef,
  apiSseEventsCatalogLinkForStreamRole,
  apiSseOperationSummariesByOperationId,
  assertCompatibilityOnlyNeverPreferred,
  projectAllApiSseOperationSummaries,
  projectApiSseOperationSummary,
  resolveApiSseOperationSummary,
} from "./sse-operation-summary";
import {
  API_SSE_OPERATIONS,
  findApiSseOperation,
  isApiSseOperation,
} from "./sse-operations";

describe("sse-operations inventory", () => {
  test("covers exactly the three published SSE operations", () => {
    expect(API_SSE_OPERATIONS).toHaveLength(3);
    expect(API_SSE_OPERATIONS.map((op) => op.operationId)).toEqual([
      "getEventsBySessionId",
      "getFactoryResponseEventsBySessionId",
      "getEvents",
    ]);
    expect(API_SSE_OPERATIONS.map((op) => op.path)).toEqual([
      "/factory-sessions/{session_id}/events",
      "/factory-sessions/{session_id}/response-events",
      "/events",
    ]);
  });

  test("labels roles and never prefers compatibility-only", () => {
    expect(assertCompatibilityOnlyNeverPreferred()).toBe(true);
    const byRole = Object.fromEntries(
      API_SSE_OPERATIONS.map((op) => [op.role, op]),
    );
    expect(byRole.canonical?.preferredOrCanonical).toBe(true);
    expect(byRole.ephemeral?.preferredOrCanonical).toBe(false);
    expect(byRole["compatibility-only"]?.preferredOrCanonical).toBe(false);
    expect(byRole["compatibility-only"]?.roleLabel).toMatch(
      /compatibility-only/i,
    );
  });

  test("finds operations by operationId or path+method", () => {
    expect(
      findApiSseOperation({ operationId: "getEventsBySessionId" })?.role,
    ).toBe("canonical");
    expect(
      findApiSseOperation({
        path: "/events",
        method: "GET",
      })?.operationId,
    ).toBe("getEvents");
    expect(isApiSseOperation({ operationId: "submitWorkBySessionId" })).toBe(
      false,
    );
  });
});

describe("sse-operation-summary projectors", () => {
  test("projects HTTP semantics for each role", () => {
    const summaries = projectAllApiSseOperationSummaries();
    expect(summaries).toHaveLength(3);

    const canonical = summaries.find(
      (s) => s.operationId === "getEventsBySessionId",
    );
    expect(canonical).toBeDefined();
    if (!canonical) throw new Error("expected canonical summary");
    expect(canonical.role).toBe("canonical");
    expect(canonical.preferredOrCanonical).toBe(true);
    expect(canonical.opensLiveEventStreamConnection).toBe(false);
    expect(canonical.implementsFullEventCatalog).toBe(false);

    const fields = Object.fromEntries(
      canonical.semantics.map((entry) => [entry.field, entry]),
    );
    expect(fields.transport?.applicable).toBe(true);
    expect(fields.transport?.value).toMatch(/text\/event-stream/);
    expect(fields.reconnect?.value).toMatch(/after_event_id/);
    expect(fields.cursorPrecedence?.applicable).toBe(true);
    expect(fields.cursorPrecedence?.value).toMatch(/after_event_id.*wins/i);
    expect(fields.handshakeHeaders?.applicable).toBe(true);
    expect(fields.handshakeHeaders?.value).toContain(
      "X-Factory-Session-Stream-Generation-Id",
    );
    expect(fields.dualAccept?.applicable).toBe(true);
    expect(fields.dualAccept?.value).toMatch(
      /FactorySessionEventStreamRecovery/,
    );
    expect(fields.replayRetainedHistory?.value).toMatch(/retained history/i);
    expect(fields.compatibilityOnlyStatus?.applicable).toBe(false);

    const ephemeral = summaries.find(
      (s) => s.operationId === "getFactoryResponseEventsBySessionId",
    );
    expect(ephemeral?.role).toBe("ephemeral");
    expect(ephemeral?.preferredOrCanonical).toBe(false);
    const ephemeralFields = Object.fromEntries(
      (ephemeral?.semantics ?? []).map((entry) => [entry.field, entry]),
    );
    expect(ephemeralFields.dualAccept?.applicable).toBe(false);
    expect(ephemeralFields.handshakeHeaders?.applicable).toBe(false);
    expect(ephemeralFields.replayRetainedHistory?.value).toMatch(
      /must not derive canonical/i,
    );

    const compatibility = summaries.find((s) => s.operationId === "getEvents");
    expect(compatibility?.role).toBe("compatibility-only");
    expect(compatibility?.neverPreferredOrCanonical).toBe(true);
    expect(compatibility?.preferredOrCanonical).toBe(false);
    const compatibilityFields = Object.fromEntries(
      (compatibility?.semantics ?? []).map((entry) => [entry.field, entry]),
    );
    expect(compatibilityFields.compatibilityOnlyStatus?.applicable).toBe(true);
    expect(compatibilityFields.compatibilityOnlyStatus?.value).toMatch(
      /Never present as preferred or canonical/i,
    );
  });

  test("links toward planned /docs/references/events anchors", () => {
    expect(API_EVENTS_REFERENCE_PAGE_PATH).toBe("/docs/references/events");

    const factoryEvent = apiSseEventsCatalogLinkForSchemaRef(
      "#/components/schemas/FactoryEvent",
    );
    expect(factoryEvent.anchor).toBe("components-schemas-FactoryEvent");
    expect(factoryEvent.href).toBe(
      "/docs/references/events#components-schemas-FactoryEvent",
    );
    expect(factoryEvent.label).toMatch(/FactoryEvent/);

    const responseEvent = apiSseEventsCatalogLinkForSchemaRef(
      "#/components/schemas/FactoryResponseEvent",
    );
    expect(responseEvent.anchor).toBe(
      "components-schemas-FactoryResponseEvent",
    );

    const streamLink = apiSseEventsCatalogLinkForStreamRole("canonical");
    expect(streamLink.href).toBe(
      "/docs/references/events#sse-stream-canonical",
    );

    const summary = projectApiSseOperationSummary(API_SSE_OPERATIONS[0]);
    expect(summary.eventsCatalogLinks.length).toBeGreaterThanOrEqual(2);
    expect(
      summary.eventsCatalogLinks.every((link) =>
        link.href.startsWith("/docs/references/events#"),
      ),
    ).toBe(true);
  });

  test("resolves summaries for SSE ops and skips non-SSE ops", () => {
    expect(
      resolveApiSseOperationSummary({
        operationId: "getFactoryResponseEventsBySessionId",
      })?.role,
    ).toBe("ephemeral");
    expect(
      resolveApiSseOperationSummary({
        operationId: "submitWorkBySessionId",
      }),
    ).toBeUndefined();

    const byId = apiSseOperationSummariesByOperationId();
    expect(byId.size).toBe(3);
    expect(byId.get("getEvents")?.neverPreferredOrCanonical).toBe(true);
  });
});
