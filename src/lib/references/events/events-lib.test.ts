import { describe, expect, test } from "bun:test";
import {
  assertLockedHybridPlacement,
  EVENT_STREAM_OPERATIONS,
  EVENT_STREAM_ROLES,
  EVENT_STREAM_SAFETY,
  EVENTS_ASYNCAPI_DEPENDENCY_POLICY,
  EVENTS_OPENAPI_EXPORT,
  eventStreamOperationByRole,
  eventsSurfaceAllowsPermanentAsyncApiPin,
  HYBRID_EVENT_STREAM_OWNERSHIP,
  isLockedHybridPlacement,
  isPreferredEventStreamRole,
  LOCKED_EVENT_STREAM_PLACEMENT,
} from "@/lib/references/events";
import {
  evaluatePlacementDecisionGate,
  recordedW02PlacementDecisionGateEvidence,
} from "@/lib/references-sse-asyncapi-spike/placement-decision-gate";
import { SSE_SPIKE_OPERATIONS } from "@/lib/references-sse-asyncapi-spike/sse-operations";

describe("W09 event stream operations inventory", () => {
  test("owns three stream roles in preferred-consumer order", () => {
    expect([...EVENT_STREAM_ROLES]).toEqual([
      "canonical",
      "ephemeral",
      "compatibility-only",
    ]);
    expect(EVENT_STREAM_OPERATIONS.map((op) => op.role)).toEqual([
      "canonical",
      "ephemeral",
      "compatibility-only",
    ]);
  });

  test("migrates spike path/method/operationId identities into production", () => {
    expect(EVENT_STREAM_OPERATIONS).toHaveLength(SSE_SPIKE_OPERATIONS.length);
    for (const [index, spike] of SSE_SPIKE_OPERATIONS.entries()) {
      const production = EVENT_STREAM_OPERATIONS[index];
      expect(production).toBeDefined();
      expect(production?.path).toBe(spike.path);
      expect(production?.method).toBe(spike.method);
      expect(production?.operationId).toBe(spike.operationId);
      expect(production?.role).toBe(spike.role);
    }
  });

  test("labels payload roots and never prefers compatibility-only", () => {
    expect(eventStreamOperationByRole("canonical")?.payloadRoot).toBe(
      "FactoryEvent",
    );
    expect(eventStreamOperationByRole("ephemeral")?.payloadRoot).toBe(
      "FactoryResponseEvent",
    );
    expect(eventStreamOperationByRole("compatibility-only")?.payloadRoot).toBe(
      "FactoryEvent",
    );
    expect(isPreferredEventStreamRole("canonical")).toBe(true);
    expect(isPreferredEventStreamRole("ephemeral")).toBe(false);
    expect(isPreferredEventStreamRole("compatibility-only")).toBe(false);
  });

  test("keeps static safety — never opens a live Factory connection", () => {
    expect(EVENT_STREAM_SAFETY.opensLiveFactoryConnection).toBe(false);
    expect(EVENT_STREAM_SAFETY.addsProxyRoute).toBe(false);
    expect(EVENT_STREAM_SAFETY.enablesLiveRequestPlayground).toBe(false);
    expect(EVENTS_OPENAPI_EXPORT).toBe("@you-agent-factory/api/openapi");
  });
});

describe("W09 locked hybrid placement", () => {
  test("records hybrid as the locked production placement", () => {
    expect(LOCKED_EVENT_STREAM_PLACEMENT).toBe("hybrid");
    expect(isLockedHybridPlacement("hybrid")).toBe(true);
    expect(isLockedHybridPlacement("integrated-only")).toBe(false);
    expect(isLockedHybridPlacement("separate-catalog")).toBe(false);
    expect(assertLockedHybridPlacement()).toBe("hybrid");
  });

  test("matches the merged W02 decision-gate selection", () => {
    const gate = evaluatePlacementDecisionGate(
      recordedW02PlacementDecisionGateEvidence(),
    );
    expect(gate.selected).toBe(LOCKED_EVENT_STREAM_PLACEMENT);
    expect(HYBRID_EVENT_STREAM_OWNERSHIP.eventTruthOwner).toBe(
      gate.canonicalDataBoundary.eventTruthOwner,
    );
    expect(HYBRID_EVENT_STREAM_OWNERSHIP.asyncApiRole).toBe(
      gate.canonicalDataBoundary.asyncApiRole,
    );
    const owned = new Set<string>([
      ...HYBRID_EVENT_STREAM_OWNERSHIP.apiOperationPageOwns,
    ]);
    for (const concern of gate.apiOperationPageOwnsHttpSemantics) {
      expect(owned.has(concern)).toBe(true);
    }
  });

  test("rejects reopening a non-hybrid placement", () => {
    expect(() => assertLockedHybridPlacement("separate-catalog")).toThrow(
      /locked to hybrid/,
    );
  });
});

describe("W09 AsyncAPI dependency policy", () => {
  test("does not permanently pin @fumadocs/asyncapi for production events", () => {
    expect(
      EVENTS_ASYNCAPI_DEPENDENCY_POLICY.permanentlyPinsFumadocsAsyncApi,
    ).toBe(false);
    expect(
      EVENTS_ASYNCAPI_DEPENDENCY_POLICY.productionEventsSurfaceImportsAsyncApiUi,
    ).toBe(false);
    expect(eventsSurfaceAllowsPermanentAsyncApiPin()).toBe(false);
    expect(
      EVENTS_ASYNCAPI_DEPENDENCY_POLICY.upgradeRiskNotes.length,
    ).toBeGreaterThan(0);
    expect(EVENTS_ASYNCAPI_DEPENDENCY_POLICY.temporarySpikePackage).toContain(
      "@fumadocs/asyncapi",
    );
  });
});
