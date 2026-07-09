import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  FACTORY_UI_GRAPHS_CATEGORY,
  GraphNodeShell,
  GraphViewportSurface,
} from "@/features/factory-ui/graphs";

afterEach(() => {
  cleanup();
});

describe("factory-ui graphs wrappers", () => {
  test("re-exports the package graphs category identifier", () => {
    expect(FACTORY_UI_GRAPHS_CATEGORY).toBe("graphs");
  });

  test("renders GraphViewportSurface with fixture children", () => {
    render(
      <GraphViewportSurface aria-label="Factory graph viewport fixture">
        <p>Viewport fixture content</p>
      </GraphViewportSurface>,
    );

    const viewport = screen.getByRole("region", {
      name: "Factory graph viewport fixture",
    });
    expect(viewport.getAttribute("data-graph-viewport-surface")).toBe("true");
    expect(screen.getByText("Viewport fixture content")).toBeTruthy();
  });

  test("renders GraphNodeShell with fixture handles and content", () => {
    render(
      <ReactFlowProvider>
        <GraphNodeShell
          handles={[
            {
              id: "in",
              label: "In",
              side: "left",
              tone: "default",
              type: "target",
            },
            {
              id: "out",
              label: "Out",
              side: "right",
              tone: "default",
              type: "source",
            },
          ]}
          nodeKind="fixture"
          state="default"
        >
          <span>Fixture node label</span>
        </GraphNodeShell>
      </ReactFlowProvider>,
    );

    const node = screen.getByRole("article");
    expect(node.getAttribute("data-graph-node-kind")).toBe("fixture");
    expect(screen.getByText("Fixture node label")).toBeTruthy();
  });
});
