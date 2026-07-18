import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  SchemaFieldTree,
  type SchemaFieldTreeNode,
  schemaFieldLeafName,
  schemaFieldTreeNodeCanExpand,
  schemaFieldTreeNodesFromFields,
  schemaFieldTreeNodesFromProperties,
} from "@/components/references/schema";
import { createSchemaFieldModel } from "@/lib/references/schema-model";

afterEach(() => {
  cleanup();
});

const FACTORY_ARTIFACT = "@you-agent-factory/api/schemas/factory";

function address(pointer: string) {
  return { publicArtifactId: FACTORY_ARTIFACT, pointer };
}

describe("schemaFieldLeafName", () => {
  test("returns the final path segment", () => {
    expect(schemaFieldLeafName("sessionId")).toBe("sessionId");
    expect(schemaFieldLeafName("workers[].name")).toBe("name");
    expect(schemaFieldLeafName("tools.timeout")).toBe("timeout");
  });
});

describe("schemaFieldTreeNodeCanExpand", () => {
  test("allows expansion when nested children exist and field is not a $ref", () => {
    const node: SchemaFieldTreeNode = {
      field: createSchemaFieldModel({
        path: "tools",
        typeSummary: "object",
        required: false,
      }),
      children: [
        {
          field: createSchemaFieldModel({
            path: "tools.timeout",
            typeSummary: "number",
            required: true,
          }),
        },
      ],
    };
    expect(schemaFieldTreeNodeCanExpand(node)).toBe(true);
  });

  test("blocks expansion for $ref fields even when children are present", () => {
    const node: SchemaFieldTreeNode = {
      field: createSchemaFieldModel({
        path: "worker",
        typeSummary: "Worker",
        required: true,
        refTarget: address("/$defs/Worker"),
      }),
      children: [
        {
          field: createSchemaFieldModel({
            path: "worker.name",
            typeSummary: "string",
            required: true,
          }),
        },
      ],
    };
    expect(schemaFieldTreeNodeCanExpand(node)).toBe(false);
  });
});

describe("SchemaFieldTree", () => {
  test("renders field name, full path, type, required state, and description", () => {
    const field = createSchemaFieldModel({
      path: "sessionId",
      typeSummary: "string",
      required: true,
      format: "uuid",
      description: "Stable session identifier.",
    });

    render(<SchemaFieldTree fields={[field]} />);

    expect(screen.getByLabelText("Schema fields")).toBeTruthy();
    const row = screen.getByTestId("schema-field-row");
    expect(row.querySelector("[data-schema-field-name]")?.textContent).toBe(
      "sessionId",
    );
    expect(
      row.querySelector("[data-schema-field-path-label]")?.textContent,
    ).toBe("sessionId");
    expect(screen.getByText("Required")).toBeTruthy();
    expect(screen.getByText("string")).toBeTruthy();
    expect(screen.getByText("Stable session identifier.")).toBeTruthy();
  });

  test("expands and collapses nested children via keyboard-operable control", () => {
    const nodes: SchemaFieldTreeNode[] = [
      {
        field: createSchemaFieldModel({
          path: "tools",
          typeSummary: "object",
          required: false,
          description: "Tool configuration.",
        }),
        children: [
          {
            field: createSchemaFieldModel({
              path: "tools.timeout",
              typeSummary: "number",
              required: true,
            }),
          },
        ],
      },
    ];

    render(<SchemaFieldTree nodes={nodes} />);

    expect(screen.queryByText("timeout")).toBeNull();

    const expand = screen.getByRole("button", {
      name: "Expand fields under tools",
    });
    expect(expand.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(expand);
    expect(expand.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("timeout")).toBeTruthy();
    const nestedPath = screen
      .getAllByTestId("schema-field-row")
      .find(
        (row) => row.getAttribute("data-schema-field-path") === "tools.timeout",
      )
      ?.querySelector("[data-schema-field-path-label]");
    expect(nestedPath?.textContent).toBe("tools.timeout");

    fireEvent.click(expand);
    expect(expand.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("timeout")).toBeNull();
  });

  test("shows a non-recursive $ref placeholder instead of expanding targets", () => {
    const nodes: SchemaFieldTreeNode[] = [
      {
        field: createSchemaFieldModel({
          path: "worker",
          typeSummary: "Worker",
          required: true,
          refTarget: address("/$defs/Worker"),
        }),
        children: [
          {
            field: createSchemaFieldModel({
              path: "worker.name",
              typeSummary: "string",
              required: true,
            }),
          },
        ],
      },
    ];

    render(<SchemaFieldTree nodes={nodes} />);

    expect(screen.getByText("$ref → /$defs/Worker")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /Expand fields under worker/i }),
    ).toBeNull();
    expect(screen.queryByText("worker.name")).toBeNull();
  });

  test("builds flat nodes from properties without inventing nesting", () => {
    const nodes = schemaFieldTreeNodesFromProperties({
      name: createSchemaFieldModel({
        path: "name",
        typeSummary: "string",
        required: true,
      }),
      role: createSchemaFieldModel({
        path: "role",
        typeSummary: "string",
        required: false,
      }),
    });
    expect(nodes).toHaveLength(2);
    expect(nodes.every((node) => node.children === undefined)).toBe(true);

    const fromFields = schemaFieldTreeNodesFromFields([
      createSchemaFieldModel({
        path: "id",
        typeSummary: "string",
        required: true,
      }),
    ]);
    expect(fromFields[0]?.field.path).toBe("id");
  });

  test("omits absent descriptions instead of inventing copy", () => {
    render(
      <SchemaFieldTree
        fields={[
          createSchemaFieldModel({
            path: "nickname",
            typeSummary: "string",
            required: false,
          }),
        ]}
      />,
    );

    expect(
      screen
        .getByTestId("schema-field-row")
        .querySelector("[data-schema-field-description]"),
    ).toBeNull();
    expect(screen.getByText("Optional")).toBeTruthy();
  });
});
