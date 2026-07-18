import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  projectSchemaExamplesFromInputs,
  projectSchemaExamplesFromValues,
  SchemaDefinition,
  SchemaExamplePanel,
  schemaExampleOriginLabel,
} from "@/components/references/schema";
import { createSchemaDefinitionModel } from "@/lib/references/schema-model";

afterEach(() => {
  cleanup();
  mock.restore();
});

function installClipboardMock() {
  const writeText = mock((text: string) => {
    void text;
    return Promise.resolve();
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: {
      writeText: (text: string) => writeText(text),
    },
  });
  return writeText;
}

const FACTORY_ARTIFACT = "@you-agent-factory/api/schemas/factory";

function address(pointer: string) {
  return { publicArtifactId: FACTORY_ARTIFACT, pointer };
}

describe("schema example display projectors", () => {
  test("projects raw W04 example values without inventing provenance", () => {
    const displays = projectSchemaExamplesFromValues([
      { name: "writer" },
      "plain",
    ]);

    expect(displays).toHaveLength(2);
    expect(displays[0]?.id).toBe("example-1");
    expect(displays[0]?.code).toContain('"name"');
    expect(displays[0]?.code).toContain('"writer"');
    expect(displays[0]?.origin).toBeUndefined();
    expect(displays[1]?.code).toBe('"plain"');
    expect(schemaExampleOriginLabel(undefined)).toBeUndefined();
  });

  test("preserves authored vs generated origin labels when provided", () => {
    const displays = projectSchemaExamplesFromInputs([
      { value: { ok: true }, origin: "authored", label: "Happy path" },
      { value: { ok: false }, origin: "generated" },
    ]);

    expect(displays[0]?.origin).toBe("authored");
    expect(schemaExampleOriginLabel(displays[0]?.origin)).toBe(
      "Authored example",
    );
    expect(displays[1]?.origin).toBe("generated");
    expect(schemaExampleOriginLabel(displays[1]?.origin)).toBe(
      "Generated example",
    );
  });

  test("returns an empty list for absent examples instead of inventing payloads", () => {
    expect(projectSchemaExamplesFromValues(undefined)).toEqual([]);
    expect(projectSchemaExamplesFromValues([])).toEqual([]);
    expect(projectSchemaExamplesFromInputs(undefined)).toEqual([]);
  });
});

describe("SchemaExamplePanel", () => {
  test("renders examples through CodePanel with copy affordance", async () => {
    const writeText = installClipboardMock();
    const sample = { sessionId: "sess_1", role: "writer" };

    render(
      <SchemaExamplePanel
        exampleInputs={[{ value: sample, origin: "authored" }]}
      />,
    );

    const panel = screen.getByTestId("schema-example-panel");
    expect(panel.getAttribute("data-schema-examples")).toBe("present");
    expect(screen.getByRole("heading", { name: "Examples" })).toBeTruthy();

    const code = screen.getByTestId("schema-example-code-example-1");
    expect(code.tagName).toBe("PRE");
    expect(code.textContent).toContain('"sessionId"');
    expect(code.textContent).toContain('"sess_1"');

    expect(screen.getByText("Authored example")).toBeTruthy();
    expect(
      panel.querySelector('[data-schema-example-origin="authored"]'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy example" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    const copied = writeText.mock.calls[0]?.[0];
    expect(typeof copied).toBe("string");
    expect(copied).toContain('"sessionId"');
  });

  test("labels generated examples distinctly and never as authored", () => {
    render(
      <SchemaExamplePanel
        exampleInputs={[
          { value: { auto: true }, origin: "generated", id: "gen-1" },
        ]}
      />,
    );

    expect(screen.getByText("Generated example")).toBeTruthy();
    expect(screen.queryByText("Authored example")).toBeNull();
    expect(
      screen
        .getByTestId("schema-example-panel")
        .querySelector('[data-schema-example-origin="generated"]'),
    ).toBeTruthy();
  });

  test("does not claim authored when provenance is unknown", () => {
    render(<SchemaExamplePanel values={[{ bare: true }]} />);

    expect(screen.queryByText("Authored example")).toBeNull();
    expect(screen.queryByText("Generated example")).toBeNull();
    expect(
      screen
        .getByTestId("schema-example-panel")
        .querySelector('[data-schema-example-origin="unknown"]'),
    ).toBeTruthy();
  });

  test("shows accessible empty affordance when examples are absent", () => {
    render(<SchemaExamplePanel showEmpty values={undefined} />);

    const panel = screen.getByTestId("schema-example-panel");
    expect(panel.getAttribute("data-schema-examples")).toBe("empty");
    const empty = screen.getByTestId("schema-example-empty");
    expect(empty.getAttribute("role")).toBe("status");
    expect(
      within(empty).getByText(
        "No schema examples are available for this definition.",
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId(/schema-example-code-/)).toBeNull();
  });

  test("returns null when empty and showEmpty is false", () => {
    const { container } = render(
      <SchemaExamplePanel showEmpty={false} values={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("SchemaDefinition example wiring", () => {
  test("renders definition examples through SchemaExamplePanel", async () => {
    const writeText = installClipboardMock();
    const definition = createSchemaDefinitionModel({
      address: address("/$defs/WithExamples"),
      title: "WithExamples",
      type: "object",
      examples: [{ name: "writer" }],
    });

    render(<SchemaDefinition definition={definition} />);

    expect(screen.getByTestId("schema-definition-examples")).toBeTruthy();
    const code = screen.getByTestId("schema-example-code-example-1");
    expect(code.tagName).toBe("PRE");
    expect(code.textContent).toContain('"writer"');

    fireEvent.click(screen.getByRole("button", { name: "Copy example" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
  });

  test("omits examples section when definition has none and showEmptyExamples is false", () => {
    const definition = createSchemaDefinitionModel({
      address: address("/$defs/NoExamples"),
      title: "NoExamples",
      type: "object",
    });

    render(<SchemaDefinition definition={definition} />);

    expect(screen.queryByTestId("schema-definition-examples")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Examples" })).toBeNull();
  });

  test("can surface empty examples affordance when requested", () => {
    const definition = createSchemaDefinitionModel({
      address: address("/$defs/EmptyExamples"),
      title: "EmptyExamples",
      type: "object",
    });

    render(<SchemaDefinition definition={definition} showEmptyExamples />);

    expect(
      screen.getByTestId("schema-example-empty").getAttribute("role"),
    ).toBe("status");
  });
});
