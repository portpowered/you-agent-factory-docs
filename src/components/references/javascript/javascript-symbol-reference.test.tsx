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
import {
  filterJavascriptSymbolsExcludingSharedSchemaDuplicates,
  isJavascriptSymbolDuplicatingSharedSchema,
  trimJavascriptSharedSchemaDefinitionForCard,
} from "./javascript-shared-schema-presentation";
import {
  javascriptSymbolBindingLifecycleLabel,
  javascriptSymbolKindLabel,
  javascriptSymbolMutabilityLabel,
  javascriptSymbolNullabilityLabel,
} from "./javascript-symbol-metadata";
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

describe("javascript symbol metadata labels", () => {
  test("formats published kind and binding labels without inventing values", () => {
    expect(javascriptSymbolKindLabel("value")).toBe("Value");
    expect(javascriptSymbolKindLabel("function")).toBe("Function");
    expect(javascriptSymbolMutabilityLabel("mutable-object")).toBe(
      "Mutable object",
    );
    expect(javascriptSymbolNullabilityLabel("non-null")).toBe("Non-null");
    expect(javascriptSymbolBindingLifecycleLabel("snapshot-at-bind")).toBe(
      "Snapshot at bind",
    );
    expect(javascriptSymbolBindingLifecycleLabel("live-namespace")).toBe(
      "Live namespace",
    );
    expect(javascriptSymbolKindLabel("custom-published-kind")).toBe(
      "Custom Published Kind",
    );
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
    expect(screen.getByText("Kind: Function")).toBeTruthy();
    expect(
      container.querySelector(
        '[data-javascript-metadata-facet="kind"][data-javascript-metadata-value="function"]',
      ),
    ).toBeTruthy();
    expect(screen.getByText("Lifecycle: Active")).toBeTruthy();
    expect(screen.getByText("Visibility: Public")).toBeTruthy();
    expect(
      container.querySelector(
        '[data-javascript-shared-schema-link="javascript.schema.json_compatible"]',
      ),
    ).toBeTruthy();
    expect(screen.getByText('log("checkpoint", { step: 1 })')).toBeTruthy();
  });

  test("omits family/package/source chrome and duplicated visibility text", () => {
    const { container } = render(
      <JavaScriptSymbolReference
        packageVersion="0.0.0"
        symbol={fixtureSymbol()}
      />,
    );

    expect(container.querySelector("[data-contract-source-badge]")).toBeNull();
    expect(container.querySelector("[data-source-artifact]")).toBeNull();
    expect(container.querySelector("[data-package-version]")).toBeNull();
    expect(screen.queryByText("Family")).toBeNull();
    expect(screen.queryByText("Package version")).toBeNull();
    expect(screen.queryByText("Source artifact")).toBeNull();
    expect(screen.queryByText("0.0.0")).toBeNull();
    expect(
      screen.queryByText("@you-agent-factory/api/javascript/runtime"),
    ).toBeNull();

    // Lifecycle/visibility remain as pills; no Visibility metadata row.
    expect(
      container.querySelector("[data-reference-status-chrome]"),
    ).toBeTruthy();
    expect(screen.getByText("Lifecycle: Active")).toBeTruthy();
    expect(screen.getByText("Visibility: Public")).toBeTruthy();
    expect(screen.queryByText("Public")).toBeNull();
  });

  test("renders glossary-backed mutability and nullability pills when published", () => {
    const { container } = render(
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

    expect(screen.getByText("Kind: Value")).toBeTruthy();
    expect(screen.getByText("Mutability: Mutable object")).toBeTruthy();
    expect(screen.getByText("Nullability: Non-null")).toBeTruthy();
    expect(
      screen.getByText("Binding lifecycle: Snapshot at bind"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-javascript-symbol-metadata-pills]"),
    ).toBeTruthy();
    expect(
      container
        .querySelector('[data-javascript-metadata-facet="kind"]')
        ?.getAttribute("href"),
    ).toBe("#glossary-kind");
    expect(
      container
        .querySelector('[data-javascript-metadata-facet="mutability"]')
        ?.getAttribute("href"),
    ).toBe("#glossary-mutability");
    expect(
      container
        .querySelector('[data-javascript-metadata-facet="nullability"]')
        ?.getAttribute("href"),
    ).toBe("#glossary-nullability");
    expect(
      container
        .querySelector('[data-javascript-metadata-facet="bindingLifecycle"]')
        ?.getAttribute("href"),
    ).toBe("#glossary-binding-lifecycle");

    // No duplicated text-row labels beside the pills.
    expect(screen.queryByText("mutable-object")).toBeNull();
    expect(screen.queryByText("non-null")).toBeNull();
    expect(screen.queryByText("snapshot-at-bind")).toBeNull();
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

    expect(screen.queryByText("Kind: Function")).toBeNull();
    expect(screen.queryByText("Kind: Value")).toBeNull();
    expect(
      container.querySelector("[data-javascript-symbol-metadata-pills]"),
    ).toBeNull();
    expect(container.querySelector("[data-javascript-examples]")).toBeNull();
    expect(
      container.querySelector("[data-javascript-shared-schema-links]"),
    ).toBeNull();
  });
});

describe("javascript shared schema presentation helpers", () => {
  test("detects shared-schema duplicates by id or source pointer", () => {
    const schemas = [fixtureSharedSchema()];
    expect(
      isJavascriptSymbolDuplicatingSharedSchema(
        fixtureSymbol({
          id: "javascript.schema.checkpoint_spec",
          name: "checkpoint_spec",
          symbolPath: "checkpoint_spec",
        }),
        schemas,
      ),
    ).toBe(true);
    expect(
      isJavascriptSymbolDuplicatingSharedSchema(
        fixtureSymbol({
          id: "javascript.schema.from-pointer",
          source: {
            publicArtifactId: "@you-agent-factory/api/javascript/runtime",
            pointer: "/sharedSchemas/javascript.schema.from-pointer",
            path: "generated/javascript/runtime-api.json",
          },
        }),
        schemas,
      ),
    ).toBe(true);
    expect(
      isJavascriptSymbolDuplicatingSharedSchema(fixtureSymbol(), schemas),
    ).toBe(false);
  });

  test("filters duplicate symbols while keeping ordinary runtime symbols", () => {
    const schemas = [fixtureSharedSchema()];
    const filtered = filterJavascriptSymbolsExcludingSharedSchemaDuplicates(
      [
        fixtureSymbol(),
        fixtureSymbol({
          id: "javascript.schema.checkpoint_spec",
          name: "checkpoint_spec",
          symbolPath: "checkpoint_spec",
          anchor: "javascript.schema.checkpoint_spec",
        }),
      ],
      schemas,
    );
    expect(javascriptSymbolInventoryIdentities(filtered)).toEqual(["log"]);
  });

  test("trims title, type, and object-policy from schema body chrome", () => {
    const trimmed = trimJavascriptSharedSchemaDefinitionForCard(
      fixtureSchemaBody(),
    );
    expect(trimmed.title).toBeUndefined();
    expect(trimmed.type).toBeUndefined();
    expect(trimmed.additionalProperties).toBeUndefined();
    expect(trimmed.properties?.label).toBeTruthy();
    expect(trimmed.required).toEqual(["label"]);
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

  test("omits family/package/source chrome and duplicated identity fields", () => {
    const { container } = render(
      <JavaScriptSharedSchemaReference
        packageVersion="0.0.0"
        schema={fixtureSharedSchema()}
      />,
    );

    expect(container.querySelector("[data-contract-source-badge]")).toBeNull();
    expect(container.querySelector("[data-source-artifact]")).toBeNull();
    expect(container.querySelector("[data-package-version]")).toBeNull();
    expect(screen.queryByText("Family")).toBeNull();
    expect(screen.queryByText("Package version")).toBeNull();
    expect(screen.queryByText("Source artifact")).toBeNull();
    expect(screen.queryByText("Schema id")).toBeNull();
    expect(screen.queryByText("Name")).toBeNull();
    expect(screen.queryByText("Title")).toBeNull();
    expect(screen.queryByText("Type")).toBeNull();
    expect(screen.queryByText("Object policy")).toBeNull();
    expect(screen.queryByText("0.0.0")).toBeNull();
    expect(
      screen.queryByText("@you-agent-factory/api/javascript/runtime"),
    ).toBeNull();

    // Lifecycle/visibility remain as pills; no Visibility metadata row.
    expect(
      container.querySelector("[data-reference-status-chrome]"),
    ).toBeTruthy();
    expect(screen.getByText("Lifecycle: Active")).toBeTruthy();
    expect(screen.getByText("Visibility: Public")).toBeTruthy();
    expect(
      container.querySelector("[data-schema-definition-embed]"),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-schema-property="label"]'),
    ).toBeTruthy();
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

  test("keeps shared-schema duplicates out of the Symbols list", () => {
    const sharedSchemas = [fixtureSharedSchema()];
    const symbols = [
      fixtureSymbol(),
      fixtureSymbol({
        id: "javascript.schema.checkpoint_spec",
        name: "checkpoint_spec",
        symbolPath: "checkpoint_spec",
        kind: "value",
        anchor: "javascript.schema.checkpoint_spec-symbol",
        sharedSchemaLinks: undefined,
        examples: undefined,
      }),
    ];
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

    const symbolCards = container.querySelectorAll(
      "[data-javascript-symbol-reference]",
    );
    expect(symbolCards.length).toBe(1);
    expect(symbolCards[0]?.getAttribute("data-javascript-symbol-path")).toBe(
      "log",
    );
    expect(
      container.querySelectorAll("[data-javascript-shared-schema-reference]")
        .length,
    ).toBe(1);
    expect(
      container
        .querySelector("[data-javascript-runtime-inventory]")
        ?.getAttribute("data-javascript-symbol-count"),
    ).toBe("1");
    expect(
      container.querySelector(
        '[data-javascript-shared-schema-id="javascript.schema.checkpoint_spec"]',
      ),
    ).toBeTruthy();
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
