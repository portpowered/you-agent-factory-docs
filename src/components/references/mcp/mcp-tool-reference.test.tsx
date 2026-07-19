import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { McpToolNormalized } from "@/lib/references/family-normalized-models";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "@/lib/references/schema-model";
import { McpToolInventory } from "./McpToolInventory";
import {
  McpToolReference,
  mcpToolInventoryIdentities,
} from "./McpToolReference";

afterEach(() => {
  cleanup();
});

function fixtureInputSchema() {
  return createSchemaDefinitionModel({
    address: {
      publicArtifactId: "@you-agent-factory/api/mcp",
      pointer: "/tools/1/inputSchema",
    },
    title: "you.factory_session.get input",
    type: "object",
    required: ["sessionId"],
    additionalProperties: false,
    properties: {
      sessionId: createSchemaFieldModel({
        path: "sessionId",
        typeSummary: "string",
        required: true,
        description: "Stable durable Factory Session identifier.",
        address: {
          publicArtifactId: "@you-agent-factory/api/mcp",
          pointer: "/tools/1/inputSchema/properties/sessionId",
        },
      }),
    },
  });
}

function fixtureTool(
  overrides: Partial<McpToolNormalized> = {},
): McpToolNormalized {
  return {
    id: "factory-session.get",
    name: "you.factory_session.get",
    description:
      "Get one durable Factory Session inspection read model with lifecycle status.",
    handlerRegistered: true,
    requiredInputs: ["sessionId"],
    inputSchema: fixtureInputSchema(),
    lifecycle: { state: "active", since: "0.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/mcp",
      pointer: "/tools/1",
      path: "generated/mcp/tools.json",
    },
    anchor: "you.factory_session.get",
    ...overrides,
  };
}

describe("McpToolReference", () => {
  test("renders title, description, and input schema without verbose metadata", () => {
    const { container } = render(
      <McpToolReference packageVersion="0.0.0" tool={fixtureTool()} />,
    );

    const article = container.querySelector("[data-mcp-tool-reference]");
    expect(article).toBeTruthy();
    expect(article?.getAttribute("data-mcp-tool-name")).toBe(
      "you.factory_session.get",
    );
    expect(article?.getAttribute("id")).toBe("you.factory_session.get");

    expect(
      screen.getByRole("heading", { name: "you.factory_session.get" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Get one durable Factory Session inspection read model with lifecycle status.",
      ),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-reference-copyable-anchor]"),
    ).toBeTruthy();

    expect(screen.queryByText("Handler registered")).toBeNull();
    expect(screen.queryByText("Tool name")).toBeNull();
    expect(screen.queryByText("Tool id")).toBeNull();
    expect(screen.queryByText("Required inputs")).toBeNull();
    expect(screen.queryByText("Lifecycle: Active")).toBeNull();
    expect(container.querySelector("[data-contract-source-badge]")).toBeNull();
    expect(screen.queryByText("0.0.0")).toBeNull();

    const schemaEmbed = container.querySelector(
      "[data-schema-definition-embed]",
    );
    expect(schemaEmbed).toBeTruthy();
    expect(screen.queryByText("Object policy")).toBeNull();
    expect(
      screen.queryByText("Closed (additional properties false)"),
    ).toBeNull();
    expect(schemaEmbed?.textContent).toContain("Type");
    expect(schemaEmbed?.textContent).toContain("object");
    expect(schemaEmbed?.textContent).toContain("Required");
    expect(
      container.querySelector('[data-schema-property="sessionId"]'),
    ).toBeTruthy();
    expect(
      container.querySelector(
        '[data-schema-property="sessionId"][data-schema-property-required="true"]',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Stable durable Factory Session identifier."),
    ).toBeTruthy();
  });

  test("omits Object policy chrome while keeping published schema details", () => {
    const { container } = render(
      <McpToolReference packageVersion="0.0.0" tool={fixtureTool()} />,
    );

    const schemaEmbed = container.querySelector(
      "[data-schema-definition-embed]",
    );
    expect(screen.queryByText("Object policy")).toBeNull();
    expect(screen.queryByText(/additional properties/i)).toBeNull();
    expect(schemaEmbed).toBeTruthy();
    expect(schemaEmbed?.textContent).toContain("Type");
    expect(schemaEmbed?.textContent).toContain("object");
    expect(schemaEmbed?.textContent).toContain("Required");
    expect(
      container.querySelector('[data-schema-property="sessionId"]'),
    ).toBeTruthy();
  });

  test("omits description and schema embed when the projection left them absent", () => {
    const { container } = render(
      <McpToolReference
        tool={fixtureTool({
          description: undefined,
          handlerRegistered: undefined,
          requiredInputs: undefined,
          inputSchema: undefined,
          lifecycle: undefined,
        })}
      />,
    );

    expect(screen.queryByText("Handler registered")).toBeNull();
    expect(screen.queryByText("Required inputs")).toBeNull();
    expect(screen.queryByText("Lifecycle: Active")).toBeNull();
    expect(
      container.querySelector("[data-mcp-input-schema-absent]"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-schema-definition-embed]"),
    ).toBeNull();
  });

  test("does not invent schema properties when the projection omitted them", () => {
    const { container } = render(
      <McpToolReference
        tool={fixtureTool({
          requiredInputs: undefined,
          inputSchema: createSchemaDefinitionModel({
            address: {
              publicArtifactId: "@you-agent-factory/api/mcp",
              pointer: "/tools/3/inputSchema",
            },
            type: "object",
            additionalProperties: false,
          }),
        })}
      />,
    );

    expect(screen.queryByText("Required inputs")).toBeNull();
    expect(container.querySelector("[data-schema-properties]")).toBeNull();
  });

  test("renders generated examples without the explanatory notice", () => {
    const { container } = render(
      <McpToolReference packageVersion="0.0.0" tool={fixtureTool()} />,
    );

    const example = container.querySelector("[data-mcp-tool-example]");
    expect(example).toBeTruthy();
    expect(example?.getAttribute("data-mcp-example-origin")).toBe("generated");
    expect(
      container.querySelector("[data-mcp-example-generated-notice]"),
    ).toBeNull();
    expect(screen.queryByText("Generated example")).toBeNull();
    expect(
      screen.queryByText(/generated from the published tool input schema/i),
    ).toBeNull();
    expect(screen.getByText("Example (generated)")).toBeTruthy();

    const code = container.querySelector(
      "[data-mcp-example-code]",
    )?.textContent;
    expect(code).toContain('"sessionId"');
    expect(code).toContain("example-sessionId");
    expect(code).not.toContain('"extra"');
  });

  test("does not label authored examples as generated", () => {
    const authored = { sessionId: "sess_authored" };
    const { container } = render(
      <McpToolReference
        tool={fixtureTool({
          example: authored,
        })}
      />,
    );

    const example = container.querySelector("[data-mcp-tool-example]");
    expect(example?.getAttribute("data-mcp-example-origin")).toBe("authored");
    expect(
      container.querySelector("[data-mcp-example-generated-notice]"),
    ).toBeNull();
    expect(screen.queryByText("Generated example")).toBeNull();
    expect(screen.getByText("Example")).toBeTruthy();
    expect(
      container.querySelector("[data-mcp-example-code]")?.textContent,
    ).toContain("sess_authored");
  });

  test("omits the example section when no schema and no authored example exist", () => {
    const { container } = render(
      <McpToolReference
        tool={fixtureTool({
          inputSchema: undefined,
          example: undefined,
        })}
      />,
    );

    expect(container.querySelector("[data-mcp-tool-example]")).toBeNull();
  });
});

describe("McpToolInventory", () => {
  test("renders every tool identity from a success inventory", () => {
    const tools = [
      fixtureTool(),
      fixtureTool({
        id: "factory-session.list",
        name: "you.factory_session.list",
        requiredInputs: undefined,
        inputSchema: undefined,
        anchor: "you.factory_session.list",
      }),
    ];

    const { container } = render(
      <McpToolInventory
        inventory={{ state: "success", tools, packageVersion: "0.0.0" }}
      />,
    );

    expect(
      container.querySelector("[data-inventory-state='success']"),
    ).toBeTruthy();
    expect(
      container
        .querySelector("[data-mcp-tool-count]")
        ?.getAttribute("data-mcp-tool-count"),
    ).toBe("2");
    expect(mcpToolInventoryIdentities(tools)).toEqual([
      "you.factory_session.get",
      "you.factory_session.list",
    ]);
    expect(
      screen.getByRole("heading", { name: "you.factory_session.get" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "you.factory_session.list" }),
    ).toBeTruthy();
    expect(
      container.querySelectorAll("[data-reference-copyable-anchor]").length,
    ).toBe(2);
    expect(
      container.querySelector("[data-reference-inventory-filter]"),
    ).toBeTruthy();
  });

  test("surfaces ReferenceEmptyState for empty inventories", () => {
    render(<McpToolInventory inventory={{ state: "empty" }} />);
    expect(screen.getByText("No MCP tools")).toBeTruthy();
    expect(
      screen.getByText(
        "No published MCP tools were found in the resolved contract.",
      ),
    ).toBeTruthy();
  });

  test("surfaces ReferenceEmptyState when success inventory has zero tools", () => {
    render(<McpToolInventory inventory={{ state: "success", tools: [] }} />);
    expect(screen.getByText("No MCP tools")).toBeTruthy();
  });

  test("surfaces ReferenceErrorState for malformed inventories", () => {
    render(
      <McpToolInventory
        inventory={{
          state: "error",
          detail: 'Malformed MCP artifact: field "tools" must be an array.',
        }}
      />,
    );
    expect(screen.getByText("MCP inventory error")).toBeTruthy();
    expect(
      screen.getByText(
        'Malformed MCP artifact: field "tools" must be an array.',
      ),
    ).toBeTruthy();
  });
});
