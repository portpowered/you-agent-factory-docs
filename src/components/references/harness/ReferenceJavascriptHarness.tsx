import {
  JavaScriptRuntimeInventory,
  type JavaScriptRuntimeInventoryInput,
} from "@/components/references/javascript";
import type {
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
} from "@/lib/references/family-normalized-models";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "@/lib/references/schema-model";

const fixtureSymbols: JavascriptSymbolNormalized[] = [
  {
    id: "javascript.args",
    name: "args",
    symbolPath: "args",
    kind: "value",
    description:
      "Mutable invocation argument value bound from workflow request args JSON at script start.",
    visibility: "public",
    mutability: "mutable-object",
    nullability: "non-null",
    bindingLifecycle: "snapshot-at-bind",
    examples: ['{ "subject": "release", "count": 2, "prefix": "echo" }'],
    lifecycle: { state: "active", since: "1.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/javascript/runtime",
      pointer: "/symbols/javascript.args",
      path: "generated/javascript/runtime-api.json",
    },
    anchor: "javascript.args",
  },
  {
    id: "javascript.log",
    name: "log",
    symbolPath: "log",
    kind: "function",
    description:
      "Synchronously emits one workflow-scoped log record. The first argument must be a non-empty string message.",
    visibility: "public",
    examples: ['log("checkpoint", { step: 1 })'],
    sharedSchemaLinks: [
      {
        schemaId: "javascript.schema.json_compatible",
        ref: "#/sharedSchemas/javascript.schema.json_compatible/schema",
        anchor: "javascript.schema.json_compatible",
      },
    ],
    lifecycle: { state: "active", since: "1.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/javascript/runtime",
      pointer: "/symbols/javascript.log",
      path: "generated/javascript/runtime-api.json",
    },
    anchor: "javascript.log",
  },
];

const fixtureSharedSchemas: JavascriptSharedSchemaNormalized[] = [
  {
    id: "javascript.schema.checkpoint_spec",
    name: "checkpoint_spec",
    title: "Checkpoint specification object",
    description: "Closed object shape for workflow.checkpoint spec arguments.",
    visibility: "public",
    examples: ['{ "label": "draft", "state": {} }'],
    schema: createSchemaDefinitionModel({
      address: {
        publicArtifactId: "@you-agent-factory/api/javascript/runtime",
        pointer: "/sharedSchemas/javascript.schema.checkpoint_spec/schema",
      },
      title: "Checkpoint specification object",
      description:
        "Closed object shape for workflow.checkpoint spec arguments.",
      type: "object",
      required: ["label"],
      additionalProperties: false,
      properties: {
        label: createSchemaFieldModel({
          path: "label",
          typeSummary: "string",
          required: true,
          address: {
            publicArtifactId: "@you-agent-factory/api/javascript/runtime",
            pointer:
              "/sharedSchemas/javascript.schema.checkpoint_spec/schema/properties/label",
          },
        }),
        state: createSchemaFieldModel({
          path: "state",
          typeSummary:
            "#/sharedSchemas/javascript.schema.json_compatible/schema",
          required: false,
          address: {
            publicArtifactId: "@you-agent-factory/api/javascript/runtime",
            pointer:
              "/sharedSchemas/javascript.schema.checkpoint_spec/schema/properties/state",
          },
        }),
      },
    }),
    lifecycle: { state: "active", since: "1.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/javascript/runtime",
      pointer: "/sharedSchemas/javascript.schema.checkpoint_spec",
      path: "generated/javascript/runtime-api.json",
    },
    anchor: "javascript.schema.checkpoint_spec",
  },
  {
    id: "javascript.schema.json_compatible",
    name: "json_compatible",
    title: "JSON-compatible value",
    description: "JSON-compatible value union used across runtime helpers.",
    visibility: "public",
    schema: createSchemaDefinitionModel({
      address: {
        publicArtifactId: "@you-agent-factory/api/javascript/runtime",
        pointer: "/sharedSchemas/javascript.schema.json_compatible/schema",
      },
      title: "JSON-compatible value",
      composition: {
        oneOf: [
          {
            publicArtifactId: "@you-agent-factory/api/javascript/runtime",
            pointer:
              "/sharedSchemas/javascript.schema.json_compatible/schema/oneOf/0",
          },
          {
            publicArtifactId: "@you-agent-factory/api/javascript/runtime",
            pointer:
              "/sharedSchemas/javascript.schema.json_compatible/schema/oneOf/1",
          },
        ],
      },
    }),
    lifecycle: { state: "active", since: "1.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/javascript/runtime",
      pointer: "/sharedSchemas/javascript.schema.json_compatible",
      path: "generated/javascript/runtime-api.json",
    },
    anchor: "javascript.schema.json_compatible",
  },
];

const successInventory: JavaScriptRuntimeInventoryInput = {
  state: "success",
  symbols: fixtureSymbols,
  sharedSchemas: fixtureSharedSchemas,
  packageVersion: "0.0.0",
};

/**
 * Dev-only fixture mount for W10 JavaScript runtime reference renderers.
 * Passes already-normalized projections — no W03 Node acquisition in the
 * browser bundle. Final `/docs/references/javascript-runtime` stays out of
 * scope for W10.
 */
export function ReferenceJavascriptHarness() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10"
      data-reference-javascript-harness=""
    >
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dev-only JavaScript reference harness
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          W10 JavaScript symbol and shared schema reference
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fixture mount for JavaScriptSymbolReference /
          JavaScriptSharedSchemaReference / JavaScriptRuntimeInventory using
          W04-shaped normalized projections with thin SchemaDefinitionModel
          embeds. Not a production reference route.
        </p>
      </header>

      <section
        className="space-y-3"
        data-harness-section="javascript-inventory"
      >
        <h2 className="text-lg font-semibold">
          JavaScriptRuntimeInventory (success)
        </h2>
        <JavaScriptRuntimeInventory inventory={successInventory} />
      </section>

      <section className="space-y-3" data-harness-section="javascript-empty">
        <h2 className="text-lg font-semibold">Empty inventory</h2>
        <JavaScriptRuntimeInventory inventory={{ state: "empty" }} />
      </section>

      <section className="space-y-3" data-harness-section="javascript-error">
        <h2 className="text-lg font-semibold">Malformed inventory</h2>
        <JavaScriptRuntimeInventory
          inventory={{
            state: "error",
            detail:
              'Malformed JavaScript artifact: field "symbols" must be an object.',
          }}
        />
      </section>
    </div>
  );
}
