import { describe, expect, mock, test } from "bun:test";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { useEffect } from "react";
import { FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM } from "../../src/content/docs-diagrams";

const fitViewCalls: unknown[] = [];
const resizeObserverEntries: Array<{
  callback: ResizeObserverCallback;
  observedElements: Element[];
}> = [];

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
    onInit,
  }: {
    children?: React.ReactNode;
    nodes: Array<{ id: string; data: { label: React.ReactNode } }>;
    onInit?: (instance: { fitView: (options: unknown) => void }) => void;
  }) => {
    useEffect(() => {
      onInit?.({
        fitView(options) {
          fitViewCalls.push(options);
        },
      });
    }, [onInit]);

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
  test("re-fits the graph after the diagram container resizes", async () => {
    fitViewCalls.length = 0;
    resizeObserverEntries.length = 0;

    render(
      <ReactFlowDiagram definition={FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM} />,
    );

    await waitFor(() => {
      expect(fitViewCalls.length).toBeGreaterThan(0);
    });

    expect(resizeObserverEntries).toHaveLength(1);

    const figure = screen.getByRole("figure", {
      name: FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
    });
    const graphic = within(figure).getByLabelText(
      FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
    );
    expect(resizeObserverEntries[0]?.observedElements).toContain(graphic);

    fitViewCalls.length = 0;

    act(() => {
      resizeObserverEntries[0]?.callback([], {} as ResizeObserver);
    });

    await waitFor(() => {
      expect(fitViewCalls).toEqual([
        {
          padding: 0.2,
          minZoom: 0.3,
        },
      ]);
    });
  });

  test("renders the workflow graph with accessible labels and checked-in source", () => {
    fitViewCalls.length = 0;
    resizeObserverEntries.length = 0;

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
