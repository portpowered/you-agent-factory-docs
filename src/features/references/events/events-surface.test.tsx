import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import {
  EVENTS_UI_STATUS_DEFAULT_MESSAGES,
  EVENTS_UI_STATUS_KINDS,
  EventsStatus,
  EventsSurface,
} from "@/features/references/events";
import {
  EVENT_STREAM_OPERATIONS,
  LOCKED_EVENT_STREAM_PLACEMENT,
} from "@/lib/references/events";

afterEach(() => {
  cleanup();
});

describe("events UI ownership surface", () => {
  test("exports the three non-success status kinds", () => {
    expect([...EVENTS_UI_STATUS_KINDS]).toEqual(["loading", "empty", "error"]);
  });

  test("EventsStatus loading uses an accessible status region", () => {
    render(
      <EventsStatus
        kind="loading"
        message={EVENTS_UI_STATUS_DEFAULT_MESSAGES.loading}
      />,
    );

    const region = screen.getByRole("status", { name: "Loading" });
    expect(region.getAttribute("data-events-status")).toBe("loading");
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(
      screen.getByText(EVENTS_UI_STATUS_DEFAULT_MESSAGES.loading),
    ).toBeTruthy();
  });

  test("EventsStatus empty uses an accessible status region", () => {
    render(
      <EventsStatus
        kind="empty"
        message="No stream operations were published for this artifact."
        title="Empty streams"
      />,
    );

    const region = screen.getByRole("status", { name: "Empty streams" });
    expect(region.getAttribute("data-events-status")).toBe("empty");
    expect(
      screen.getByText(
        "No stream operations were published for this artifact.",
      ),
    ).toBeTruthy();
  });

  test("EventsStatus error uses an accessible alert", () => {
    render(
      <EventsStatus
        kind="error"
        message="OpenAPI resolution rejected the event corpus."
        title="Corpus error"
      />,
    );

    const alert = screen.getByRole("alert", { name: "Corpus error" });
    expect(alert.getAttribute("data-events-status")).toBe("error");
    expect(
      screen.getByText("OpenAPI resolution rejected the event corpus."),
    ).toBeTruthy();
  });
});

describe("EventsSurface", () => {
  test("short-circuits non-success statuses to EventsStatus messaging", () => {
    render(
      <EventsSurface
        status="empty"
        statusMessage="Nothing to show."
        statusTitle="Empty"
      >
        <p>should not render</p>
      </EventsSurface>,
    );

    expect(screen.getByRole("status", { name: "Empty" })).toBeTruthy();
    expect(screen.getByText("Nothing to show.")).toBeTruthy();
    expect(screen.queryByText("should not render")).toBeNull();
  });

  test("success status renders children and records hybrid ownership markers", () => {
    render(
      <EventsSurface status="success">
        <p>Event corpus ready</p>
        <ul>
          {EVENT_STREAM_OPERATIONS.map((operation) => (
            <li key={operation.operationId}>{operation.roleLabel}</li>
          ))}
        </ul>
      </EventsSurface>,
    );

    const surface = screen.getByTestId("events-surface");
    expect(surface.getAttribute("data-events-status")).toBe("success");
    expect(surface.getAttribute("data-events-ownership")).toBe(
      "w09-production",
    );
    expect(surface.getAttribute("data-events-placement")).toBe(
      LOCKED_EVENT_STREAM_PLACEMENT,
    );
    expect(surface.getAttribute("data-events-truth-owner")).toBe("openapi");
    expect(surface.getAttribute("data-events-asyncapi-permanent-pin")).toBe(
      "false",
    );
    expect(screen.getByText("Event corpus ready")).toBeTruthy();
    expect(
      screen.getByText("Canonical session-scoped FactoryEvent stream"),
    ).toBeTruthy();
  });

  test("error surface never renders a blank panel", () => {
    render(<EventsSurface status="error" />);

    const alert = screen.getByRole("alert");
    expect(alert.textContent?.trim().length).toBeGreaterThan(0);
    expect(alert.getAttribute("data-events-status")).toBe("error");
  });

  test("loading surface never renders a blank panel", () => {
    render(<EventsSurface status="loading" />);

    const region = screen.getByRole("status");
    expect(region.getAttribute("data-events-status")).toBe("loading");
    expect(region.textContent?.trim().length).toBeGreaterThan(0);
  });
});
