import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  EventCanonicalityBadge,
  EventStreamOperationSummary,
  EventStreamOperationsList,
  EventsVerificationHarness,
  eventCanonicalityPresentationForRole,
  eventStreamOperationSummaryModelFromSelected,
  eventStreamOperationSummaryModelsFromCorpus,
} from "@/components/references/events";
import {
  EVENT_STREAM_OPERATIONS,
  eventSchemaDisplayTargetsForStreams,
  isPreferredEventStreamRole,
  resolveEventCorpus,
  type SelectedEventStream,
} from "@/lib/references/events";

afterEach(() => {
  cleanup();
});

function fixtureStream(
  overrides: Partial<SelectedEventStream> &
    Pick<SelectedEventStream, "role" | "path" | "operationId" | "roleLabel">,
): SelectedEventStream {
  const preferred = overrides.role !== "compatibility-only";
  return {
    method: "get",
    status: "200",
    mediaType: "text/event-stream",
    wireSchema: { type: "object" },
    payloadRootRef: `#/components/schemas/${
      overrides.payloadRootSchemaName ??
      (overrides.role === "ephemeral" ? "FactoryResponseEvent" : "FactoryEvent")
    }`,
    payloadRootSchemaName:
      overrides.payloadRootSchemaName ??
      (overrides.role === "ephemeral"
        ? "FactoryResponseEvent"
        : "FactoryEvent"),
    preferred,
    compatibilityLabel: preferred
      ? "preferred"
      : "compatibility-only-non-preferred",
    ...overrides,
  };
}

describe("event canonicality presentation", () => {
  test("marks only the canonical stream as preferred session + canonical replay", () => {
    const canonical = eventCanonicalityPresentationForRole("canonical");
    const ephemeral = eventCanonicalityPresentationForRole("ephemeral");
    const compatibility =
      eventCanonicalityPresentationForRole("compatibility-only");

    expect(canonical.isPreferredSessionStream).toBe(true);
    expect(canonical.isCanonicalReplayState).toBe(true);
    expect(canonical.badgeLabel).toBe("Canonical");
    expect(isPreferredEventStreamRole("canonical")).toBe(true);

    expect(ephemeral.isPreferredSessionStream).toBe(false);
    expect(ephemeral.isCanonicalReplayState).toBe(false);
    expect(ephemeral.badgeLabel).toBe("Ephemeral");

    expect(compatibility.isPreferredSessionStream).toBe(false);
    expect(compatibility.isCompatibilityOnly).toBe(true);
    expect(compatibility.isCanonicalReplayState).toBe(false);
    expect(compatibility.badgeLabel).toBe("Compatibility-only");
  });
});

describe("EventCanonicalityBadge", () => {
  test("renders preferred label for the canonical session stream", () => {
    render(<EventCanonicalityBadge streamRole="canonical" />);

    const badge = screen.getByTestId("event-canonicality-badge");
    expect(badge.getAttribute("data-event-stream-role")).toBe("canonical");
    expect(badge.getAttribute("data-event-preferred-session-stream")).toBe(
      "true",
    );
    expect(badge.getAttribute("data-event-canonical-replay")).toBe("true");
    expect(screen.getByText("Canonical")).toBeTruthy();
    expect(screen.getByText("Preferred")).toBeTruthy();
  });

  test("labels ephemeral as not preferred and not canonical replay", () => {
    render(<EventCanonicalityBadge streamRole="ephemeral" />);

    const badge = screen.getByTestId("event-canonicality-badge");
    expect(badge.getAttribute("data-event-preferred-session-stream")).toBe(
      "false",
    );
    expect(badge.getAttribute("data-event-canonical-replay")).toBe("false");
    expect(screen.getByText("Ephemeral")).toBeTruthy();
    expect(screen.getByText("Not preferred")).toBeTruthy();
    expect(screen.getByText("Not canonical replay")).toBeTruthy();
  });

  test("labels compatibility-only as non-canonical and never preferred", () => {
    render(<EventCanonicalityBadge streamRole="compatibility-only" />);

    const badge = screen.getByTestId("event-canonicality-badge");
    expect(badge.getAttribute("data-event-compatibility-only")).toBe("true");
    expect(badge.getAttribute("data-event-preferred-session-stream")).toBe(
      "false",
    );
    expect(screen.getByText("Compatibility-only")).toBeTruthy();
    expect(screen.getByText("Not preferred")).toBeTruthy();
    expect(screen.getByText("Non-canonical")).toBeTruthy();
  });
});

describe("EventStreamOperationSummary", () => {
  test("identifies payload root and links toward catalog anchors", () => {
    const stream = fixtureStream({
      role: "canonical",
      path: "/factory-sessions/{session_id}/events",
      operationId: "getEventsBySessionId",
      roleLabel: "Canonical session-scoped FactoryEvent stream",
      payloadRootSchemaName: "FactoryEvent",
    });
    const [target] = eventSchemaDisplayTargetsForStreams([stream]);
    const summary = eventStreamOperationSummaryModelFromSelected(
      stream,
      target,
    );

    render(<EventStreamOperationSummary summary={summary} />);

    const article = screen.getByTestId("event-stream-operation-summary");
    expect(article.getAttribute("data-event-payload-root")).toBe(
      "FactoryEvent",
    );
    expect(article.getAttribute("data-event-preferred-session-stream")).toBe(
      "true",
    );
    expect(article.getAttribute("data-event-stream-path")).toBe(
      "/factory-sessions/{session_id}/events",
    );
    expect(
      screen.getByText("/factory-sessions/{session_id}/events"),
    ).toBeTruthy();
    expect(screen.getByText("getEventsBySessionId")).toBeTruthy();

    const catalogLink = screen.getByRole("link", { name: "FactoryEvent" });
    expect(catalogLink.getAttribute("href")).toBe(`#${target?.eventAnchor}`);
    expect(catalogLink.getAttribute("data-event-catalog-link")).toBe("");
  });

  test("ephemeral summary never claims canonical replay state", () => {
    const stream = fixtureStream({
      role: "ephemeral",
      path: "/factory-sessions/{session_id}/response-events",
      operationId: "getFactoryResponseEventsBySessionId",
      roleLabel: "Ephemeral FactoryResponseEvent stream",
      payloadRootSchemaName: "FactoryResponseEvent",
    });
    const summary = eventStreamOperationSummaryModelFromSelected(stream);

    render(<EventStreamOperationSummary summary={summary} />);

    const article = screen.getByTestId("event-stream-operation-summary");
    expect(article.getAttribute("data-event-payload-root")).toBe(
      "FactoryResponseEvent",
    );
    expect(article.getAttribute("data-event-preferred-session-stream")).toBe(
      "false",
    );
    expect(
      screen.getByText(/do not treat response events as canonical/i),
    ).toBeTruthy();
  });
});

describe("EventStreamOperationsList against live packaged OpenAPI", () => {
  test("renders all three roles with correct preferred/canonicality semantics", () => {
    const corpus = resolveEventCorpus();
    const summaries = eventStreamOperationSummaryModelsFromCorpus({
      selectedStreams: corpus.selectedStreams,
      schemaTargets: corpus.schemaTargets,
    });

    expect(summaries.map((item) => item.role)).toEqual([
      "canonical",
      "ephemeral",
      "compatibility-only",
    ]);
    expect(summaries.map((item) => item.path)).toEqual(
      EVENT_STREAM_OPERATIONS.map((item) => item.path),
    );

    render(
      <EventsVerificationHarness
        sourceHash={corpus.sourceHash}
        summaries={summaries}
      />,
    );

    const list = screen.getByTestId("event-stream-operations-list");
    expect(list.getAttribute("data-event-stream-count")).toBe("3");

    const canonical = screen
      .getByText("Canonical session-scoped FactoryEvent stream")
      .closest('[data-testid="event-stream-operation-summary"]');
    expect(canonical).toBeTruthy();
    expect(canonical?.getAttribute("data-event-stream-role")).toBe("canonical");
    expect(canonical?.getAttribute("data-event-preferred-session-stream")).toBe(
      "true",
    );
    expect(canonical?.getAttribute("data-event-payload-root")).toBe(
      "FactoryEvent",
    );
    expect(
      within(canonical as HTMLElement).getByText("Preferred"),
    ).toBeTruthy();

    const ephemeral = screen
      .getByText("Ephemeral FactoryResponseEvent stream")
      .closest('[data-testid="event-stream-operation-summary"]');
    expect(ephemeral?.getAttribute("data-event-stream-role")).toBe("ephemeral");
    expect(ephemeral?.getAttribute("data-event-preferred-session-stream")).toBe(
      "false",
    );
    expect(ephemeral?.getAttribute("data-event-payload-root")).toBe(
      "FactoryResponseEvent",
    );
    expect(
      within(ephemeral as HTMLElement).queryByText("Preferred"),
    ).toBeNull();
    expect(
      within(ephemeral as HTMLElement).getByText("Not preferred"),
    ).toBeTruthy();

    const compatibility = screen
      .getByText("Compatibility-only process-global FactoryEvent stream")
      .closest('[data-testid="event-stream-operation-summary"]');
    expect(compatibility?.getAttribute("data-event-stream-role")).toBe(
      "compatibility-only",
    );
    expect(
      compatibility?.getAttribute("data-event-preferred-session-stream"),
    ).toBe("false");
    expect(
      within(compatibility as HTMLElement).getByText("Non-canonical"),
    ).toBeTruthy();
    expect(
      within(compatibility as HTMLElement).getByText("Not preferred"),
    ).toBeTruthy();
    expect(
      within(compatibility as HTMLElement).getByText(
        /Compatibility-only \/ non-canonical/i,
      ),
    ).toBeTruthy();
  });

  test("empty list renders accessible empty messaging", () => {
    render(<EventStreamOperationsList summaries={[]} />);

    const list = screen.getByTestId("event-stream-operations-list");
    expect(list.getAttribute("data-event-stream-count")).toBe("0");
    expect(screen.getByRole("status")).toBeTruthy();
    expect(
      screen.getByText("No event-stream operations are available."),
    ).toBeTruthy();
  });
});
