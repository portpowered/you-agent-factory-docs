import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
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

  test("labels compatibility-only as never preferred", () => {
    const summary = resolveApiSseOperationSummary({
      operationId: "getEvents",
    });
    expect(summary).toBeDefined();
    if (!summary) throw new Error("expected compatibility summary");

    render(<ApiSseOperationSummaryPanel summary={summary} />);
    expect(screen.getByText("Compatibility-only")).toBeTruthy();
    expect(screen.getByText("Never preferred")).toBeTruthy();
    expect(screen.queryByText("Preferred")).toBeNull();
    expect(
      screen.getByText(/Never present as preferred or canonical/i),
    ).toBeTruthy();
  });
});

describe("ApiOperationSection SSE wiring", () => {
  test("mounts hybrid summaries on the three SSE operations only", () => {
    const { byAnchor } = buildApiOperationDetailsFromArtifact();
    const canonical = byAnchor.get("getEventsBySessionId");
    const ephemeral = byAnchor.get("getFactoryResponseEventsBySessionId");
    const compatibility = byAnchor.get("getEvents");
    const nonSse = byAnchor.get("submitWorkBySessionId");

    expect(canonical).toBeDefined();
    expect(ephemeral).toBeDefined();
    expect(compatibility).toBeDefined();
    expect(nonSse).toBeDefined();
    if (!canonical || !ephemeral || !compatibility || !nonSse) {
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

    rerender(<ApiOperationSection detail={compatibility} />);
    expect(
      container.querySelector(`[${API_SSE_SUMMARY_ATTR}="getEvents"]`),
    ).toBeTruthy();
    expect(
      container.querySelector(`[${API_SSE_ROLE_ATTR}="compatibility-only"]`),
    ).toBeTruthy();
    expect(within(container).getByText("Never preferred")).toBeTruthy();

    rerender(<ApiOperationSection detail={nonSse} />);
    expect(container.querySelector(`[${API_SSE_SUMMARY_ATTR}]`)).toBeNull();
  });

  test("harness renders all three SSE summaries without a live connection", () => {
    const { model } = buildApiOperationNavigationFromArtifact();
    const { byAnchor } = buildApiOperationDetailsFromArtifact();
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={byAnchor}
        model={model}
      />,
    );

    const summaries = projectAllApiSseOperationSummaries();
    expect(summaries).toHaveLength(3);
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
