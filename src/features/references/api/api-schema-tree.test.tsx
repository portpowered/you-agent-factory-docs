import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import {
  API_SCHEMA_COMPONENT_PROBE,
  loadApiOpenApiArtifact,
} from "@/features/references/api";
import {
  API_SCHEMA_FIELD_ATTR,
  API_SCHEMA_TREE_ATTR,
  type ApiSchemaComponents,
  ApiSchemaTree,
  type JsonSchemaLike,
  resolveSchemaRef,
  schemaComponentName,
  schemaTypeLabel,
} from "./api-schema-tree";

const COMPONENTS: ApiSchemaComponents = {
  Work: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", description: "Human label." },
      workTypeName: { type: "string" },
      owner: { $ref: "#/components/schemas/Owner" },
    },
  },
  Owner: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      team: { $ref: "#/components/schemas/Team" },
    },
  },
  Team: {
    type: "object",
    properties: { slug: { type: "string" } },
  },
  Loop: {
    type: "object",
    properties: { parent: { $ref: "#/components/schemas/Loop" } },
  },
  Base: {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
  Extended: {
    allOf: [
      { $ref: "#/components/schemas/Base" },
      {
        type: "object",
        required: ["extra"],
        properties: { extra: { type: "number" } },
      },
    ],
  },
  Listing: { type: "array", items: { $ref: "#/components/schemas/Work" } },
};

function fieldNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll(`[${API_SCHEMA_FIELD_ATTR}]`)].map(
    (node) => node.getAttribute(API_SCHEMA_FIELD_ATTR) ?? "",
  );
}

describe("schema ref resolution", () => {
  test("reads component names only from local schema pointers", () => {
    expect(schemaComponentName("#/components/schemas/Work")).toBe("Work");
    expect(schemaComponentName("#/components/parameters/Id")).toBeUndefined();
    expect(schemaComponentName("https://example.test/Work")).toBeUndefined();
    expect(schemaComponentName(undefined)).toBeUndefined();
  });

  test("follows ref chains and reports the resolved component name", () => {
    const resolved = resolveSchemaRef(
      { $ref: "#/components/schemas/Work" },
      COMPONENTS,
    );
    expect(resolved.name).toBe("Work");
    expect(resolved.schema?.properties?.name?.type).toBe("string");
  });

  test("returns no schema for a pointer with no matching component", () => {
    const resolved = resolveSchemaRef(
      { $ref: "#/components/schemas/Missing" },
      COMPONENTS,
    );
    // Names the dangling target rather than inventing an empty object, so the
    // caller can still label the field.
    expect(resolved.name).toBe("Missing");
    expect(resolved.schema).toBeUndefined();
  });

  test("labels arrays by their item schema", () => {
    expect(
      schemaTypeLabel({ $ref: "#/components/schemas/Listing" }, COMPONENTS),
    ).toBe("array of Work");
    expect(
      schemaTypeLabel({ type: "string", format: "uuid" }, COMPONENTS),
    ).toBe("string (uuid)");
  });
});

describe("ApiSchemaTree", () => {
  test("expands a $ref into its component field names", () => {
    const { container } = render(
      <ApiSchemaTree
        components={COMPONENTS}
        schema={{ $ref: "#/components/schemas/Work" }}
      />,
    );

    expect(
      container.querySelector(`[${API_SCHEMA_TREE_ATTR}="Work"]`),
    ).toBeTruthy();
    expect(fieldNames(container)).toContain("name");
    expect(fieldNames(container)).toContain("workTypeName");
  });

  test("marks required and optional fields distinctly", () => {
    const { container } = render(
      <ApiSchemaTree
        components={COMPONENTS}
        schema={{ $ref: "#/components/schemas/Work" }}
      />,
    );

    const name = container.querySelector(`[${API_SCHEMA_FIELD_ATTR}="name"]`);
    const optional = container.querySelector(
      `[${API_SCHEMA_FIELD_ATTR}="workTypeName"]`,
    );
    expect(name?.textContent).toContain("required");
    expect(optional?.textContent).toContain("optional");
  });

  test("merges allOf members into one field list", () => {
    const { container } = render(
      <ApiSchemaTree
        components={COMPONENTS}
        schema={{ $ref: "#/components/schemas/Extended" }}
      />,
    );

    const names = fieldNames(container);
    expect(names).toContain("id");
    expect(names).toContain("extra");
  });

  test("defers deep nesting to details rather than inlining every level", () => {
    const { container } = render(
      <ApiSchemaTree
        components={COMPONENTS}
        schema={{ $ref: "#/components/schemas/Work" }}
      />,
    );

    // `owner` expands inline at depth 0; `team` sits one level deeper and is
    // collapsed, which is what keeps a 442-schema document from expanding into
    // an unbounded tree on first paint.
    expect(fieldNames(container)).toContain("id");
    expect(container.querySelector("details")).toBeTruthy();
  });

  test("stops at a recursive reference instead of looping", () => {
    const { container } = render(
      <ApiSchemaTree
        components={COMPONENTS}
        schema={{ $ref: "#/components/schemas/Loop" }}
      />,
    );

    expect(container.textContent).toContain("Recursive reference to");
    expect(fieldNames(container)).toEqual(["parent"]);
  });

  test("renders nothing when the schema publishes no fields", () => {
    const { container } = render(
      <ApiSchemaTree components={COMPONENTS} schema={{ type: "string" }} />,
    );
    expect(container.querySelector(`[${API_SCHEMA_TREE_ATTR}]`)).toBeNull();
  });

  test("renders the packaged component the schema probe pins", () => {
    const loaded = loadApiOpenApiArtifact();
    const components = (
      loaded.document as {
        components?: { schemas?: ApiSchemaComponents };
      }
    ).components?.schemas;
    expect(components).toBeTruthy();
    if (components === undefined) return;

    const { container } = render(
      <ApiSchemaTree
        components={components}
        schema={
          { $ref: API_SCHEMA_COMPONENT_PROBE.schemaRef } as JsonSchemaLike
        }
      />,
    );

    // Same guarantee the browser probe asserted against Fumadocs Schema UI:
    // a request-body $ref must render field structure, not a display name.
    const names = fieldNames(container);
    for (const expected of API_SCHEMA_COMPONENT_PROBE.expectedFieldNames) {
      expect(names).toContain(expected);
    }
  });
});
