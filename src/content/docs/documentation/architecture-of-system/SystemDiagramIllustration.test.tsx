/**
 * Render proof for the page-local architecture system-diagram illustration.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { SystemDiagramIllustration } from "./SystemDiagramIllustration";

afterEach(() => {
  cleanup();
});

describe("SystemDiagramIllustration", () => {
  test("renders a titled factory-ui system diagram with legend and labeled flow", () => {
    render(<SystemDiagramIllustration />);

    expect(screen.getByTestId("system-diagram-illustration")).toBeTruthy();
    expect(
      screen.getByText("How work moves through you-agent-factory"),
    ).toBeTruthy();

    const viewport = screen.getByRole("region", {
      name: "How work moves through you-agent-factory",
    });
    expect(viewport.getAttribute("data-graph-viewport-surface")).toBe("true");

    expect(screen.getByText("Submitted work")).toBeTruthy();
    expect(screen.getByText("Factory Session")).toBeTruthy();
    expect(screen.getByText("Workstation")).toBeTruthy();
    expect(screen.getByText("Worker")).toBeTruthy();
    expect(screen.getByText("Resource (optional)")).toBeTruthy();
    expect(screen.getByText("Work states")).toBeTruthy();

    const legend = screen
      .getByTestId("system-diagram-illustration")
      .querySelector("[data-system-diagram-legend]");
    expect(legend).toBeTruthy();
    const legendQueries = within(legend as HTMLElement);
    expect(legendQueries.getByText("Session / work flow")).toBeTruthy();
    expect(legendQueries.getByText("Worker dispatch / outcome")).toBeTruthy();
    expect(legendQueries.getByText("Optional resource bound")).toBeTruthy();

    expect(
      screen.getByText(/Submitted work enters a live Factory Session/i),
    ).toBeTruthy();
  });
});
