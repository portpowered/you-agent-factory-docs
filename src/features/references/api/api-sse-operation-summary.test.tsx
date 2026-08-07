import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ApiNavigationVerificationHarness } from "./api-navigation-verification-harness";
import { ApiOperationSection } from "./api-operation-section";
import { ApiSseOperationSummaryPanel } from "./api-sse-operation-summary";
import { buildApiOperationDetailsFromArtifact } from "./load-operation-details";
import { buildApiOperationNavigationFromArtifact } from "./load-operation-navigation";
import {
  projectAllApiSseOperationSummaries,
  resolveApiSseOperationSummary,
} from "./sse-operation-summary";
import { API_SSE_ROLE_ATTR, API_SSE_SUMMARY_ATTR } from "./sse-operations";

afterEach(() => {
  cleanup();
});

describe("ApiSseOperationSummaryPanel", () => {
  test("renders role, HTTP semantics, and events catalog links", () => {
    const summary = resolveApiSseOperationSummary({
      operationId: "getEventsBySessionId",
    });
    expect(summary).toBeDefined();
    if (!summary) throw new Error("expected canonical summary");

    const { container } = render(
      <ApiSseOperationSummaryPanel summary={summary} />,
    );

    expect(screen.getByText("SSE stream summary")).toBeTruthy();
    expect(screen.getByText("Canonical")).toBeTruthy();
    expect(screen.getByText("Preferred")).toBeTruthy();
    expect(screen.getByText(summary.roleLabel)).toBeTruthy();

    const panel = container.querySelector(`[${API_SSE_SUMMARY_ATTR}]`);
    expect(panel?.getAttribute(API_SSE_ROLE_ATTR)).toBe("canonical");
    expect(panel?.getAttribute("data-api-sse-live-connection")).toBe("false");
    expect(panel?.getAttribute("data-api-sse-full-catalog")).toBe("false");

    expect(screen.getByText("Transport / media type")).toBeTruthy();
    expect(screen.getByText("Reconnect")).toBeTruthy();
    expect(screen.getByText("Cursor precedence")).toBeTruthy();
    expect(screen.getByText("Handshake / response headers")).toBeTruthy();
    expect(screen.getByText("Dual Accept")).toBeTruthy();
    expect(screen.getByText("Replay / retained history")).toBeTruthy();

    const eventsLink = screen.getByRole("link", {
      name: /FactoryEvent envelope and payload catalog/i,
    });
    expect(eventsLink.getAttribute("href")).toBe(
      "/docs/references/events#components-schemas-FactoryEvent",
    );
  });

  // `@you-agent-factory/api` 0.0.6 removed the process-global GET /events
  // stream, the only compatibility-only member. The never-preferred labelling
  // itself is still exercised by `sse-operation-summary.test.ts`; there is no
  // longer a published operation to render it against.
  test("no published operation claims the compatibility-only role", () => {
    expect(
      resolveApiSseOperationSummary({ operationId: "getEvents" }),
    ).toBeUndefined();
  });
});

describe("ApiOperationSection SSE wiring", () => {
  test("mounts hybrid summaries on the SSE operations only", () => {
    const { byAnchor } = buildApiOperationDetailsFromArtifact();
    const canonical = byAnchor.get("getEventsBySessionId");
    const ephemeral = byAnchor.get("getFactoryResponseEventsBySessionId");
    const nonSse = byAnchor.get("submitWorkBySessionId");

    expect(canonical).toBeDefined();
    expect(ephemeral).toBeDefined();
    expect(byAnchor.has("getEvents")).toBe(false);
    expect(nonSse).toBeDefined();
    if (!canonical || !ephemeral || !nonSse) {
      throw new Error("expected live package operation details");
    }

    const { container, rerender } = render(
      <ApiOperationSection detail={canonical} />,
    );
    expect(
      container.querySelector(
        `[${API_SSE_SUMMARY_ATTR}="getEventsBySessionId"]`,
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(`[${API_SSE_ROLE_ATTR}="canonical"]`),
    ).toBeTruthy();

    rerender(<ApiOperationSection detail={ephemeral} />);
    expect(
      container.querySelector(
        `[${API_SSE_SUMMARY_ATTR}="getFactoryResponseEventsBySessionId"]`,
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(`[${API_SSE_ROLE_ATTR}="ephemeral"]`),
    ).toBeTruthy();

    rerender(<ApiOperationSection detail={nonSse} />);
    expect(container.querySelector(`[${API_SSE_SUMMARY_ATTR}]`)).toBeNull();
  });

  test("harness renders every SSE summary without a live connection", () => {
    const { model } = buildApiOperationNavigationFromArtifact();
    const { byAnchor } = buildApiOperationDetailsFromArtifact();
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={byAnchor}
        model={model}
      />,
    );

    const summaries = projectAllApiSseOperationSummaries();
    expect(summaries).toHaveLength(2);
    for (const summary of summaries) {
      const panel = container.querySelector(
        `[${API_SSE_SUMMARY_ATTR}="${summary.operationId}"]`,
      );
      expect(panel).toBeTruthy();
      expect(panel?.getAttribute("data-api-sse-live-connection")).toBe("false");
      expect(panel?.getAttribute("data-api-sse-full-catalog")).toBe("false");
      expect(panel?.getAttribute(API_SSE_ROLE_ATTR)).toBe(summary.role);
    }

    // No full event catalog UI markers from W09 / W02 catalog spike.
    expect(container.querySelector("[data-sse-catalog-section]")).toBeNull();
    expect(container.querySelector("[data-event-catalog-envelope]")).toBeNull();
  });
});
