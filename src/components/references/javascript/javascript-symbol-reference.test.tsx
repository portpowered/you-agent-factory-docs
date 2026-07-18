import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type {
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
} from "@/lib/references/family-normalized-models";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "@/lib/references/schema-model";
import { JavaScriptRuntimeInventory } from "./JavaScriptRuntimeInventory";
import {
  JavaScriptSharedSchemaReference,
  javascriptSharedSchemaInventoryIdentities,
} from "./JavaScriptSharedSchemaReference";
import {
  JavaScriptSymbolReference,
  javascriptSymbolInventoryIdentities,
} from "./JavaScriptSymbolReference";
import { mapJavascriptVisibilityToReferenceVisibility } from "./javascript-visibility";

afterEach(() => {
  cleanup();
});

function fixtureSchemaBody() {
  return createSchemaDefinitionModel({
    address: {
      publicArtifactId: "@you-agent-factory/api/javascript/runtime",
      pointer: "/sharedSchemas/javascript.schema.checkpoint_spec/schema",
    },
    title: "Checkpoint specification object",
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
        typeSummary: "#/sharedSchemas/javascript.schema.json_compatible/schema",
        required: false,
        refTarget: {
          publicArtifactId: "@you-agent-factory/api/javascript/runtime",
          pointer: "#/sharedSchemas/javascript.schema.json_compatible/schema",
        },
        address: {
          publicArtifactId: "@you-agent-factory/api/javascript/runtime",
          pointer:
            "/sharedSchemas/javascript.schema.checkpoint_spec/schema/properties/state",
        },
      }),
    },
  });
}

function fixtureSymbol(
  overrides: Partial<JavascriptSymbolNormalized> = {},
): JavascriptSymbolNormalized {
  return {
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
    ...overrides,
  };
}

function fixtureSharedSchema(
  overrides: Partial<JavascriptSharedSchemaNormalized> = {},
): JavascriptSharedSchemaNormalized {
  return {
    id: "javascript.schema.checkpoint_spec",
    name: "checkpoint_spec",
    title: "Checkpoint specification object",
    description: "Closed object shape for workflow.checkpoint spec arguments.",
    visibility: "public",
    examples: ['{ "label": "draft", "state": {} }'],
    schema: fixtureSchemaBody(),
    lifecycle: { state: "active", since: "1.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/javascript/runtime",
      pointer: "/sharedSchemas/javascript.schema.checkpoint_spec",
      path: "generated/javascript/runtime-api.json",
    },
    anchor: "javascript.schema.checkpoint_spec",
    ...overrides,
  };
}

describe("mapJavascriptVisibilityToReferenceVisibility", () => {
  test("maps public and internal contract values", () => {
    expect(mapJavascriptVisibilityToReferenceVisibility("public")).toBe(
      "public",
    );
    expect(mapJavascriptVisibilityToReferenceVisibility("internal")).toBe(
      "internal",
    );
    expect(
      mapJavascriptVisibilityToReferenceVisibility("mystery"),
    ).toBeUndefined();
  });
});

describe("JavaScriptSymbolReference", () => {
  test("renders available metadata, examples, and shared schema links", () => {
    const { container } = render(
      <JavaScriptSymbolReference
        packageVersion="0.0.0"
        symbol={fixtureSymbol()}
      />,
    );

    const article = container.querySelector(
      "[data-javascript-symbol-reference]",
    );
    expect(article).toBeTruthy();
    expect(article?.getAttribute("data-javascript-symbol-path")).toBe("log");
    expect(article?.getAttribute("id")).toBe("javascript.log");

    expect(screen.getByRole("heading", { name: "log" })).toBeTruthy();
    expect(
      screen.getByText(
        "Synchronously emits one workflow-scoped log record. The first argument must be a non-empty string message.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Kind")).toBeTruthy();
    expect(screen.getByText("function")).toBeTruthy();
    expect(screen.getByText("0.0.0")).toBeTruthy();
    expect(screen.getByText("Lifecycle: Active")).toBeTruthy();
    expect(
      container.querySelector(
        '[data-javascript-shared-schema-link="javascript.schema.json_compatible"]',
      ),
    ).toBeTruthy();
    expect(screen.getByText('log("checkpoint", { step: 1 })')).toBeTruthy();
  });

  test("renders mutability and nullability when published", () => {
    render(
      <JavaScriptSymbolReference
        symbol={fixtureSymbol({
          kind: "value",
          symbolPath: "args",
          id: "javascript.args",
          name: "args",
          anchor: "javascript.args",
          mutability: "mutable-object",
          nullability: "non-null",
          bindingLifecycle: "snapshot-at-bind",
          sharedSchemaLinks: undefined,
          examples: undefined,
        })}
      />,
    );

    expect(screen.getByText("Mutability")).toBeTruthy();
    expect(screen.getByText("mutable-object")).toBeTruthy();
    expect(screen.getByText("Nullability")).toBeTruthy();
    expect(screen.getByText("non-null")).toBeTruthy();
    expect(screen.getByText("Binding lifecycle")).toBeTruthy();
    expect(screen.getByText("snapshot-at-bind")).toBeTruthy();
  });

  test("omits optional metadata when the projection left it absent", () => {
    const { container } = render(
      <JavaScriptSymbolReference
        symbol={fixtureSymbol({
          description: undefined,
          kind: undefined,
          visibility: undefined,
          mutability: undefined,
          nullability: undefined,
          bindingLifecycle: undefined,
          examples: undefined,
          sharedSchemaLinks: undefined,
          lifecycle: undefined,
        })}
      />,
    );

    expect(screen.queryByText("Kind")).toBeNull();
    expect(screen.queryByText("Mutability")).toBeNull();
    expect(container.querySelector("[data-javascript-examples]")).toBeNull();
    expect(
      container.querySelector("[data-javascript-shared-schema-links]"),
    ).toBeNull();
  });
});

describe("JavaScriptSharedSchemaReference", () => {
  test("renders schema embed and authored examples", () => {
    const { container } = render(
      <JavaScriptSharedSchemaReference
        packageVersion="0.0.0"
        schema={fixtureSharedSchema()}
      />,
    );

    const article = container.querySelector(
      "[data-javascript-shared-schema-reference]",
    );
    expect(article).toBeTruthy();
    expect(article?.getAttribute("id")).toBe(
      "javascript.schema.checkpoint_spec",
    );
    expect(
      screen.getByRole("heading", { name: "Checkpoint specification object" }),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-schema-definition-embed]"),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-schema-property="label"]'),
    ).toBeTruthy();
    expect(screen.getByText('{ "label": "draft", "state": {} }')).toBeTruthy();
  });

  test("discloses absent schema body without inventing properties", () => {
    const { container } = render(
      <JavaScriptSharedSchemaReference
        schema={fixtureSharedSchema({
          schema: undefined,
          examples: undefined,
        })}
      />,
    );

    expect(
      container.querySelector("[data-javascript-shared-schema-absent]"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-schema-definition-embed]"),
    ).toBeNull();
  });
});

describe("JavaScriptRuntimeInventory", () => {
  test("renders every symbol and shared schema identity", () => {
    const symbols = [
      fixtureSymbol(),
      fixtureSymbol({
        id: "javascript.args",
        name: "args",
        symbolPath: "args",
        kind: "value",
        anchor: "javascript.args",
        mutability: "mutable-object",
        sharedSchemaLinks: undefined,
        examples: undefined,
      }),
    ];
    const sharedSchemas = [fixtureSharedSchema()];
    const { container } = render(
      <JavaScriptRuntimeInventory
        inventory={{
          state: "success",
          symbols,
          sharedSchemas,
          packageVersion: "0.0.0",
        }}
      />,
    );

    expect(
      container
        .querySelector("[data-javascript-runtime-inventory]")
        ?.getAttribute("data-inventory-state"),
    ).toBe("success");
    expect(
      container.querySelectorAll("[data-javascript-symbol-reference]").length,
    ).toBe(2);
    expect(
      container.querySelectorAll("[data-javascript-shared-schema-reference]")
        .length,
    ).toBe(1);
    expect(javascriptSymbolInventoryIdentities(symbols)).toEqual([
      "log",
      "args",
    ]);
    expect(javascriptSharedSchemaInventoryIdentities(sharedSchemas)).toEqual([
      "javascript.schema.checkpoint_spec",
    ]);
  });

  test("shows empty state for empty inventories", () => {
    const { container } = render(
      <JavaScriptRuntimeInventory inventory={{ state: "empty" }} />,
    );
    expect(
      container
        .querySelector("[data-javascript-runtime-inventory]")
        ?.getAttribute("data-inventory-state"),
    ).toBe("empty");
    expect(screen.getByText("No JavaScript runtime items")).toBeTruthy();
  });

  test("shows error state for malformed inventories", () => {
    const { container } = render(
      <JavaScriptRuntimeInventory
        inventory={{
          state: "error",
          detail:
            'Malformed JavaScript artifact: field "symbols" must be an object.',
        }}
      />,
    );
    expect(
      container
        .querySelector("[data-javascript-runtime-inventory]")
        ?.getAttribute("data-inventory-state"),
    ).toBe("error");
    expect(screen.getByText("JavaScript inventory error")).toBeTruthy();
    expect(
      screen.getByText(
        'Malformed JavaScript artifact: field "symbols" must be an object.',
      ),
    ).toBeTruthy();
  });
});
