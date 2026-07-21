import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import {
  filterSchemaDefinitions,
  filterSchemaFieldTreeNodes,
  normalizeSchemaFilterQuery,
  type SchemaFieldTreeNode,
  SchemaFilter,
  schemaDefinitionMatchesFilter,
  schemaFilterHasNoMatches,
  schemaFilterQueryIsEmpty,
  schemaTextMatchesFilter,
} from "@/features/references/schema";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "@/lib/references/schema-model";

afterEach(() => {
  cleanup();
});

const FACTORY_ARTIFACT = "@you-agent-factory/api/schemas/factory";

function address(pointer: string) {
  return { publicArtifactId: FACTORY_ARTIFACT, pointer };
}

function makeDefinitions() {
  return [
    createSchemaDefinitionModel({
      address: address("/$defs/Worker"),
      title: "Worker",
      description: "A factory worker contract",
      type: "object",
      properties: {
        name: createSchemaFieldModel({
          path: "name",
          required: true,
          typeSummary: "string",
          description: "Worker display name",
        }),
        harnessId: createSchemaFieldModel({
          path: "harnessId",
          required: false,
          typeSummary: "string",
        }),
      },
    }),
    createSchemaDefinitionModel({
      address: address("/$defs/Session"),
      title: "Session",
      type: "object",
      properties: {
        id: createSchemaFieldModel({
          path: "id",
          required: true,
          typeSummary: "string",
        }),
      },
    }),
  ];
}

function makeFieldTree(): SchemaFieldTreeNode[] {
  return [
    {
      field: createSchemaFieldModel({
        path: "workers",
        required: true,
        typeSummary: "object",
      }),
      children: [
        {
          field: createSchemaFieldModel({
            path: "workers.name",
            required: true,
            typeSummary: "string",
            description: "Worker display name",
          }),
        },
        {
          field: createSchemaFieldModel({
            path: "workers.role",
            required: false,
            typeSummary: "string",
          }),
        },
      ],
    },
    {
      field: createSchemaFieldModel({
        path: "timeoutMs",
        required: false,
        typeSummary: "integer",
      }),
    },
  ];
}

describe("schema filter display projectors", () => {
  test("normalizes queries without inventing matches for empty input", () => {
    expect(normalizeSchemaFilterQuery("  Worker  ")).toBe("worker");
    expect(schemaFilterQueryIsEmpty("   ")).toBe(true);
    expect(schemaTextMatchesFilter("Worker", "")).toBe(true);
    expect(schemaTextMatchesFilter(undefined, "x")).toBe(false);
  });

  test("filters definitions by title, pointer, and property path without mutating input", () => {
    const definitions = makeDefinitions();
    const original = [...definitions];

    const byTitle = filterSchemaDefinitions(definitions, "session");
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0]?.title).toBe("Session");

    const byField = filterSchemaDefinitions(definitions, "harnessId");
    expect(byField).toHaveLength(1);
    expect(byField[0]?.title).toBe("Worker");

    expect(definitions).toEqual(original);
    const worker = definitions.find(
      (definition) => definition.title === "Worker",
    );
    expect(worker).toBeDefined();
    if (worker === undefined) {
      throw new Error("expected Worker definition fixture");
    }
    expect(schemaDefinitionMatchesFilter(worker, "factory worker")).toBe(true);
  });

  test("filters field trees keeping ancestors of matches and all children of matching parents", () => {
    const tree = makeFieldTree();
    const originalPaths = tree.map((node) => node.field.path);

    const byLeaf = filterSchemaFieldTreeNodes(tree, "role");
    expect(byLeaf).toHaveLength(1);
    expect(byLeaf[0]?.field.path).toBe("workers");
    expect(byLeaf[0]?.children).toHaveLength(1);
    expect(byLeaf[0]?.children?.[0]?.field.path).toBe("workers.role");

    const byParent = filterSchemaFieldTreeNodes(tree, "workers");
    expect(byParent).toHaveLength(1);
    expect(byParent[0]?.children).toHaveLength(2);

    expect(tree.map((node) => node.field.path)).toEqual(originalPaths);
    expect(tree[0]?.children).toHaveLength(2);
  });

  test("reports empty-filter matches only for active queries against non-empty sources", () => {
    const definitions = makeDefinitions();
    expect(schemaFilterHasNoMatches({ query: "", definitions })).toBe(false);
    expect(schemaFilterHasNoMatches({ query: "zzzz", definitions })).toBe(true);
    expect(schemaFilterHasNoMatches({ query: "zzzz", definitions: [] })).toBe(
      false,
    );
  });
});

describe("SchemaFilter", () => {
  test("filters definitions and fields from keyboard-accessible input", () => {
    const definitions = makeDefinitions();
    const fieldNodes = makeFieldTree();

    render(
      <SchemaFilter
        defaultExpanded
        definitions={definitions}
        fieldNodes={fieldNodes}
      />,
    );

    const input = screen.getByRole("searchbox", {
      name: "Filter schema definitions and fields",
    });
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: "Session" } });

    const results = screen.getByTestId("schema-filter-results");
    const definitionPointers = [
      ...results.querySelectorAll("[data-schema-filter-definition-pointer]"),
    ].map((element) =>
      element.getAttribute("data-schema-filter-definition-pointer"),
    );
    expect(definitionPointers).toEqual(["/$defs/Session"]);
    expect(
      within(results).getByText("Session", {
        selector: "[data-schema-filter-definition-title]",
      }),
    ).toBeTruthy();

    fireEvent.change(input, { target: { value: "timeout" } });
    const fieldTree = screen.getByTestId("schema-filter-field-tree");
    expect(fieldTree).toBeTruthy();
    expect(
      fieldTree.querySelector('[data-schema-field-path="timeoutMs"]'),
    ).toBeTruthy();
  });

  test("shows an explicit empty-filter status when nothing matches", () => {
    render(
      <SchemaFilter
        definitions={makeDefinitions()}
        fieldNodes={makeFieldTree()}
      />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Filter schema definitions and fields",
      }),
      { target: { value: "no-such-contract-item" } },
    );

    const empty = screen.getByTestId("schema-filter-empty");
    expect(empty.getAttribute("role")).toBe("status");
    expect(empty.getAttribute("data-schema-status")).toBe("empty");
    expect(
      within(empty).getByText("No definitions or fields match this filter."),
    ).toBeTruthy();
    expect(screen.queryByTestId("schema-filter-results")).toBeNull();
  });

  test("clear button resets the query and restores full lists", () => {
    const onQueryChange = mock((query: string) => {
      void query;
    });

    render(
      <SchemaFilter
        definitions={makeDefinitions()}
        fieldNodes={makeFieldTree()}
        onQueryChange={onQueryChange}
      />,
    );

    const input = screen.getByRole("searchbox", {
      name: "Filter schema definitions and fields",
    }) as HTMLInputElement;
    const clear = screen.getByRole("button", { name: "Clear" });

    expect(clear.hasAttribute("disabled")).toBe(true);

    fireEvent.change(input, { target: { value: "Session" } });
    expect(input.value).toBe("Session");
    expect(clear.hasAttribute("disabled")).toBe(false);
    expect(onQueryChange).toHaveBeenCalledWith("Session");

    fireEvent.click(clear);
    expect(input.value).toBe("");
    expect(onQueryChange).toHaveBeenCalledWith("");
    expect(
      within(screen.getByTestId("schema-filter-results")).getByText("Worker", {
        selector: "[data-schema-filter-definition-title]",
      }),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("schema-filter-results")).getByText("Session", {
        selector: "[data-schema-filter-definition-title]",
      }),
    ).toBeTruthy();
  });

  test("does not mutate definition or field model arrays while filtering", () => {
    const definitions = makeDefinitions();
    const fieldNodes = makeFieldTree();
    const defSnapshot = structuredClone(definitions);
    const fieldSnapshot = structuredClone(fieldNodes);

    render(<SchemaFilter definitions={definitions} fieldNodes={fieldNodes} />);

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Filter schema definitions and fields",
      }),
      { target: { value: "role" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(definitions).toEqual(defSnapshot);
    expect(fieldNodes).toEqual(fieldSnapshot);
  });
});
