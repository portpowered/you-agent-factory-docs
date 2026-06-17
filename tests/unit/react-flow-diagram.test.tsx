import { describe, expect, mock, test } from "bun:test";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM } from "../../src/content/docs-diagrams";

const resizeObserverEntries: Array<{
  callback: ResizeObserverCallback;
  observedElements: Element[];
}> = [];
const stageStyleSnapshots: string[] = [];

class MockResizeObserver {
  #entry: {
    callback: ResizeObserverCallback;
    observedElements: Element[];
  };

  constructor(callback: ResizeObserverCallback) {
    this.#entry = {
      callback,
      observedElements: [],
    };
    resizeObserverEntries.push(this.#entry);
  }

  observe(element: Element) {
    this.#entry.observedElements.push(element);
  }

  unobserve() {}

  disconnect() {
    this.#entry.observedElements.length = 0;
  }
}

mock.module("@xyflow/react", () => ({
  Background: () => <div data-testid="react-flow-background" />,
  MarkerType: {
    ArrowClosed: "arrow-closed",
  },
  Position: {
    Top: "top",
    Right: "right",
    Bottom: "bottom",
    Left: "left",
  },
  ReactFlow: ({
    children,
    nodes,
  }: {
    children?: React.ReactNode;
    nodes: Array<{ id: string; data: { label: React.ReactNode } }>;
  }) => {
    return (
      <div className="react-flow">
        <div className="react-flow__viewport">
          {nodes.map((node) => (
            <div key={node.id}>{node.data.label}</div>
          ))}
          {children}
        </div>
      </div>
    );
  },
}));

globalThis.ResizeObserver =
  MockResizeObserver as unknown as typeof ResizeObserver;

const { ReactFlowDiagram } = await import(
  "../../src/components/docs/react-flow-diagram"
);

describe("ReactFlowDiagram", () => {
  test("reprojects the graph viewport after the diagram container resizes", async () => {
    resizeObserverEntries.length = 0;
    stageStyleSnapshots.length = 0;

    render(
      <ReactFlowDiagram definition={FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM} />,
    );

    await waitFor(() => {
      const stage = document.querySelector(".docs-diagram__react-flow-stage");
      const transform = stage?.getAttribute("style") ?? "";

      if (transform) {
        stageStyleSnapshots.push(transform);
      }

      expect(stageStyleSnapshots.length).toBeGreaterThan(0);
    });

    expect(resizeObserverEntries).toHaveLength(1);

    const figure = screen.getByRole("figure", {
      name: FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
    });
    const graphic = within(figure).getByLabelText(
      FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
    );
    expect(resizeObserverEntries[0]?.observedElements).toContain(graphic);

    const initialStageStyle = stageStyleSnapshots.at(-1);

    act(() => {
      resizeObserverEntries[0]?.callback(
        [
          {
            contentRect: {
              width: 280,
              height: 320,
            },
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    await waitFor(() => {
      const stage = document.querySelector(".docs-diagram__react-flow-stage");
      expect(stage?.getAttribute("style")).not.toEqual(initialStageStyle);
    });
  });

  test("renders the workflow graph with accessible labels and checked-in source", () => {
    resizeObserverEntries.length = 0;
    stageStyleSnapshots.length = 0;

    render(
      <ReactFlowDiagram definition={FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM} />,
    );

    const figure = screen.getByRole("figure", {
      name: FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
    });

    expect(
      within(figure).getByRole("heading", {
        level: 2,
        name: FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
      }),
    ).toBeTruthy();
    expect(
      within(figure).getByText(
        FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.description,
      ),
    ).toBeTruthy();

    const graphic = within(figure).getByLabelText(
      FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
    );
    expect(graphic.querySelector(".react-flow")).toBeTruthy();

    expect(within(figure).getByText("React Flow source of truth")).toBeTruthy();
    expect(within(figure).getByText(/"viewport": {/)).toBeTruthy();
    expect(
      within(figure).getByText(/"title": "Factory executor"/),
    ).toBeTruthy();
    expect(
      within(figure).getByText(/"label": "mergeable output"/),
    ).toBeTruthy();

    const node = within(graphic).getByText("Factory executor");
    expect(node).toBeTruthy();
    expect(
      within(graphic).getByText(
        "Implements one story, runs checks, and keeps the branch pushable.",
      ),
    ).toBeTruthy();
  });
});
