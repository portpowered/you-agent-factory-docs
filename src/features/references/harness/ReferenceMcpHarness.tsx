import {
  McpToolInventory,
  type McpToolInventoryInput,
} from "@/features/references/mcp";
import type { McpToolNormalized } from "@/lib/references/family-normalized-models";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "@/lib/references/schema-model";

const getInputSchema = createSchemaDefinitionModel({
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

const controlInputSchema = createSchemaDefinitionModel({
  address: {
    publicArtifactId: "@you-agent-factory/api/mcp",
    pointer: "/tools/0/inputSchema",
  },
  title: "you.factory_session.control input",
  type: "object",
  required: ["sessionId", "operation"],
  additionalProperties: false,
  properties: {
    sessionId: createSchemaFieldModel({
      path: "sessionId",
      typeSummary: "string",
      required: true,
      description: "Stable durable Factory Session identifier.",
      address: {
        publicArtifactId: "@you-agent-factory/api/mcp",
        pointer: "/tools/0/inputSchema/properties/sessionId",
      },
    }),
    operation: createSchemaFieldModel({
      path: "operation",
      typeSummary: "string",
      required: true,
      description: "Lifecycle control operation for one Factory Session.",
      enum: [
        "APPROVE",
        "PAUSE",
        "RESUME",
        "CANCEL",
        "TERMINATE",
        "RETRY_DISPATCH",
      ],
      address: {
        publicArtifactId: "@you-agent-factory/api/mcp",
        pointer: "/tools/0/inputSchema/properties/operation",
      },
    }),
  },
});

const fixtureTools: McpToolNormalized[] = [
  {
    id: "factory-session.control",
    name: "you.factory_session.control",
    description:
      "Apply one durable Factory Session lifecycle control such as approve, pause, resume, cancel, terminate, or retry-dispatch.",
    handlerRegistered: true,
    requiredInputs: ["sessionId", "operation"],
    inputSchema: controlInputSchema,
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/mcp",
      pointer: "/tools/0",
      path: "generated/mcp/tools.json",
    },
    anchor: "you.factory_session.control",
  },
  {
    id: "factory-session.get",
    name: "you.factory_session.get",
    description:
      "Get one durable Factory Session inspection read model with lifecycle status, source identity, phase, progress, and result summary.",
    handlerRegistered: true,
    requiredInputs: ["sessionId"],
    inputSchema: getInputSchema,
    example: { sessionId: "fs_example_authored" },
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/mcp",
      pointer: "/tools/1",
      path: "generated/mcp/tools.json",
    },
    anchor: "you.factory_session.get",
  },
  {
    id: "factory-session.list",
    name: "you.factory_session.list",
    description:
      "List Factory Sessions for one scope (live workspace, persisted durable execution, or all).",
    handlerRegistered: true,
    inputSchema: createSchemaDefinitionModel({
      address: {
        publicArtifactId: "@you-agent-factory/api/mcp",
        pointer: "/tools/3/inputSchema",
      },
      title: "you.factory_session.list input",
      type: "object",
      additionalProperties: false,
      properties: {
        scope: createSchemaFieldModel({
          path: "scope",
          typeSummary: "string",
          required: false,
          description: "Session list scope. Defaults to live when omitted.",
          enum: ["live", "persisted", "all"],
          address: {
            publicArtifactId: "@you-agent-factory/api/mcp",
            pointer: "/tools/3/inputSchema/properties/scope",
          },
        }),
      },
    }),
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/mcp",
      pointer: "/tools/3",
      path: "generated/mcp/tools.json",
    },
    anchor: "you.factory_session.list",
  },
];

const successInventory: McpToolInventoryInput = {
  state: "success",
  tools: fixtureTools,
  packageVersion: "0.0.0",
};

/**
 * Dev-only fixture mount for W10 MCP tool reference renderers.
 * Passes already-normalized projections — no W03 Node acquisition in the
 * browser bundle. Final `/docs/references/mcp-reference` stays out of scope for W10.
 */
export function ReferenceMcpHarness() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10"
      data-reference-mcp-harness=""
    >
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dev-only MCP reference harness
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          W10 MCP tool reference from package contract projections
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fixture mount for McpToolReference / McpToolInventory using W04-shaped
          normalized tools with thin SchemaDefinitionModel embeds. Includes both
          authored and generated examples (generated are labeled). Not a
          production reference route.
        </p>
      </header>

      <section className="space-y-3" data-harness-section="mcp-inventory">
        <h2 className="text-lg font-semibold">McpToolInventory (success)</h2>
        <McpToolInventory inventory={successInventory} />
      </section>

      <section className="space-y-3" data-harness-section="mcp-empty">
        <h2 className="text-lg font-semibold">Empty inventory</h2>
        <McpToolInventory inventory={{ state: "empty" }} />
      </section>

      <section className="space-y-3" data-harness-section="mcp-error">
        <h2 className="text-lg font-semibold">Malformed inventory</h2>
        <McpToolInventory
          inventory={{
            state: "error",
            detail: 'Malformed MCP artifact: field "tools" must be an array.',
          }}
        />
      </section>
    </div>
  );
}
