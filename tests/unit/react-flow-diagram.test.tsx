import { describe, expect, test } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM } from "../../src/content/docs-diagrams";

const { ReactFlowDiagram } = await import(
  "../../src/components/docs/react-flow-diagram"
);

describe("ReactFlowDiagram", () => {
  test("renders the workflow graph with accessible labels and checked-in source", () => {
    render(
      <ReactFlowDiagram definition={FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM} />,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.description),
    ).toBeTruthy();

    const graphic = screen.getByLabelText(
      FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
    );
    expect(graphic.querySelector(".react-flow")).toBeTruthy();

    expect(screen.getByText("React Flow source of truth")).toBeTruthy();
    expect(screen.getByText(/"title": "Factory executor"/)).toBeTruthy();
    expect(screen.getByText(/"label": "mergeable output"/)).toBeTruthy();

    const node = within(graphic).getByText("Factory executor");
    expect(node).toBeTruthy();
  });
});
