import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { loadMermaid } from "../../src/lib/mermaid-loader";

const initialize = mock(() => undefined);
const renderMermaid = mock(async () => ({
  svg: '<svg viewBox="0 0 120 40"><title>Workflow review loop</title><text x="0" y="20">Rendered</text></svg>',
}));

const successfulLoader: typeof loadMermaid = async () =>
  ({
    initialize,
    render: renderMermaid,
  }) as never;

const failingLoader: typeof loadMermaid = async () =>
  ({
    initialize,
    render: async () => {
      throw new Error("Parse error");
    },
  }) as never;

const { MermaidDiagram } = await import(
  "../../src/components/docs/mermaid-diagram"
);

describe("MermaidDiagram", () => {
  test("renders a loading message, projected diagram, and checked-in source", async () => {
    render(
      <MermaidDiagram
        definition={"flowchart LR\nA[Author] --> B[Review]"}
        description="A docs-owned Mermaid workflow example."
        loader={successfulLoader}
        title="Workflow review loop"
      />,
    );

    expect(
      screen.getByText("Rendering Mermaid diagram from checked-in source…"),
    ).toBeTruthy();

    const graphic = await screen.findByRole("img", {
      name: "Workflow review loop",
    });

    expect(graphic.innerHTML).toContain("<svg");
    expect(screen.getByText("Mermaid source of truth")).toBeTruthy();
    expect(screen.getByText(/A\[Author\] --> B\[Review\]/)).toBeTruthy();
    expect(initialize).toHaveBeenCalled();
    expect(renderMermaid).toHaveBeenCalledWith(
      expect.stringContaining("-diagram"),
      "flowchart LR\nA[Author] --> B[Review]",
    );
  });

  test("surfaces rendering failures explicitly", async () => {
    render(
      <MermaidDiagram
        definition={"flowchart LR\nA --> B"}
        description="A broken Mermaid workflow example."
        loader={failingLoader}
        title="Broken workflow"
      />,
    );

    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain(
      "Mermaid rendering failed: Parse error",
    );
  });
});
