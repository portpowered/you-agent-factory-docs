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
