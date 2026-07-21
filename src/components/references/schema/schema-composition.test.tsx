import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import {
  projectSchemaCompositionDisplay,
  SchemaComposition,
  SchemaFieldTree,
  type SchemaFieldTreeNode,
  SchemaRefLink,
  schemaRefLinkDisplayFromAddress,
  schemaRefLinkDisplayFromOutcome,
} from "@/components/references/schema";
import {
  buildCompositionDefinitions,
  buildRecursionCycleDefinitions,
  w04FixtureSource,
} from "@/lib/references/fixtures/w04-normalized-model-fixtures";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "@/lib/references/schema-model";

afterEach(() => {
  cleanup();
});

const FACTORY_ARTIFACT = "@you-agent-factory/api/schemas/factory";
const PAGE_PATH = "/docs/references/schema";

function address(pointer: string) {
  return { publicArtifactId: FACTORY_ARTIFACT, pointer };
}

describe("schemaRefLinkDisplayFromAddress", () => {
  test("builds a stable W04 schema-pointer anchor and optional href", () => {
    const display = schemaRefLinkDisplayFromAddress(address("/$defs/Worker"), {
      pagePath: PAGE_PATH,
    });

    expect(display.kind).toBe("resolved");
    expect(display.label).toBe("/$defs/Worker");
    expect(display.anchor).toBeTruthy();
    expect(display.anchor?.includes("/")).toBe(false);
    expect(display.href).toBe(`${PAGE_PATH}#${display.anchor}`);
  });
});

describe("schemaRefLinkDisplayFromOutcome", () => {
  test("maps resolved, cycle, missing, and malformed outcomes", () => {
    const definitions = [
      ...buildRecursionCycleDefinitions(),
      createSchemaDefinitionModel({
        address: address("/$defs/Present"),
        title: "Present",
        type: "object",
      }),
    ];
    const resolver = createReferenceCrossLinkResolver({ definitions });

    const resolved = schemaRefLinkDisplayFromOutcome(
      resolver.resolveRef({
        source: w04FixtureSource("/$defs/Caller", {
          publicArtifactId: FACTORY_ARTIFACT,
        }),
        ref: address("/$defs/Present"),
      }),
      { pagePath: PAGE_PATH },
    );
    expect(resolved.kind).toBe("resolved");
    expect(resolved.href).toContain(PAGE_PATH);

    const cycle = schemaRefLinkDisplayFromOutcome(
      resolver.resolveRefChain({
        source: w04FixtureSource("/components/schemas/Root"),
        ref: "#/components/schemas/NodeA",
      }),
      { pagePath: PAGE_PATH },
    );
    expect(cycle.kind).toBe("cycle");
    expect(cycle.detail).toContain("Cycle at");
    expect(cycle.href).toBeTruthy();

    const missing = schemaRefLinkDisplayFromOutcome(
      resolver.resolveRef({
        source: w04FixtureSource("/$defs/Caller", {
          publicArtifactId: FACTORY_ARTIFACT,
        }),
        ref: address("/$defs/DoesNotExist"),
      }),
    );
    expect(missing.kind).toBe("missing");
    expect(missing.href).toBeUndefined();
    expect(missing.detail).toContain("not in the schema catalog");

    const malformed = schemaRefLinkDisplayFromOutcome(
      resolver.resolveRef({
        source: w04FixtureSource("/$defs/Caller", {
          publicArtifactId: FACTORY_ARTIFACT,
        }),
        ref: "",
      }),
    );
    expect(malformed.kind).toBe("malformed");
    expect(malformed.href).toBeUndefined();
  });
});

describe("SchemaRefLink", () => {
  test("renders a navigable link for resolved refs", () => {
    const display = schemaRefLinkDisplayFromAddress(address("/$defs/Worker"), {
      pagePath: PAGE_PATH,
    });

    render(<SchemaRefLink display={display} />);

    const link = screen.getByRole("link", {
      name: /schema reference: \/\$defs\/Worker/i,
    });
    expect(link.getAttribute("href")).toBe(`${PAGE_PATH}#${display.anchor}`);
    expect(link.getAttribute("data-schema-ref-kind")).toBe("resolved");
    expect(link.className).toContain("text-secondary");
    expect(link.className).toContain("font-mono");
    expect(link.className).toContain("underline-offset-2");
    expect(link.className).toContain("hover:underline");
    expect(link.className).not.toMatch(/\btext-primary\b/);
  });

  test("renders cycle links with an explicit cycle sentinel", () => {
    const display = schemaRefLinkDisplayFromAddress(
      address("/components/schemas/NodeA"),
      {
        pagePath: PAGE_PATH,
        kind: "cycle",
        detail: "Cycle at /components/schemas/NodeA",
      },
    );

    render(<SchemaRefLink display={display} />);

    const link = screen.getByRole("link", {
      name: /cyclic reference/i,
    });
    expect(link.getAttribute("data-schema-ref-kind")).toBe("cycle");
    expect(screen.getByText("(cycle)")).toBeTruthy();
    expect(link.textContent).toContain("Cycle at /components/schemas/NodeA");
    expect(link.className).toContain("text-secondary");
    expect(link.className).not.toMatch(/\btext-primary\b/);
  });

  test("renders unresolved missing refs without inventing a navigable target", () => {
    render(
      <SchemaRefLink
        display={{
          kind: "missing",
          label: "/$defs/Missing",
          targetAddress: address("/$defs/Missing"),
          detail:
            "Unresolved $ref: /$defs/Missing is not in the schema catalog.",
        }}
      />,
    );

    expect(screen.queryByRole("link")).toBeNull();
    const status = screen.getByRole("status");
    expect(status.getAttribute("data-schema-ref-kind")).toBe("missing");
    expect(screen.getByText("(unresolved)")).toBeTruthy();
    expect(status.className).toContain("text-destructive");
    expect(status.className).not.toMatch(/\btext-secondary\b/);
  });
});

describe("SchemaComposition", () => {
  test("renders oneOf/anyOf/allOf branches with accessible kind labels", () => {
    const contentPart = buildCompositionDefinitions().find(
      (definition) =>
        definition.address.pointer === "/components/schemas/WorkContentPart",
    );
    expect(contentPart?.composition).toBeDefined();
    if (contentPart?.composition === undefined) {
      return;
    }

    render(
      <SchemaComposition
        composition={contentPart.composition}
        pagePath={PAGE_PATH}
      />,
    );

    expect(screen.getByLabelText("Schema composition")).toBeTruthy();
    expect(screen.getByLabelText("oneOf composition")).toBeTruthy();
    expect(screen.getByLabelText("anyOf composition")).toBeTruthy();
    expect(screen.getByLabelText("allOf composition")).toBeTruthy();

    const oneOfSection = screen.getByLabelText("oneOf composition");
    expect(
      oneOfSection.querySelectorAll("[data-schema-composition-member]"),
    ).toHaveLength(2);
    const memberLink = oneOfSection.querySelector(
      '[data-schema-ref-pointer="/components/schemas/WorkTextContentPart"]',
    );
    expect(memberLink).toBeTruthy();
    expect(memberLink?.className).toContain("text-secondary");
    expect(memberLink?.className).not.toMatch(/\btext-primary\b/);
  });

  test("renders discriminator property and mapped value links", () => {
    const contentPart = buildCompositionDefinitions().find(
      (definition) =>
        definition.address.pointer === "/components/schemas/WorkContentPart",
    );
    expect(contentPart?.composition?.discriminator).toBeDefined();
    if (contentPart?.composition === undefined) {
      return;
    }

    const definitions = buildCompositionDefinitions();
    const resolver = createReferenceCrossLinkResolver({ definitions });

    render(
      <SchemaComposition
        composition={contentPart.composition}
        pagePath={PAGE_PATH}
        resolve={(target) =>
          resolver.resolveRef({
            source: w04FixtureSource("/components/schemas/WorkContentPart"),
            ref: target,
          })
        }
      />,
    );

    expect(screen.getByLabelText("Discriminator on type")).toBeTruthy();
    expect(screen.getByText("type")).toBeTruthy();

    const textRow = document.querySelector(
      '[data-schema-discriminator-value="text"]',
    );
    expect(textRow).toBeTruthy();
    expect(
      textRow?.querySelector('[data-schema-ref-kind="resolved"]'),
    ).toBeTruthy();
  });

  test("uses pre-projected display with cycle and missing members", () => {
    const definitions = buildRecursionCycleDefinitions();
    const nodeA = definitions.find(
      (definition) =>
        definition.address.pointer === "/components/schemas/NodeA",
    );
    expect(nodeA).toBeDefined();
    if (nodeA === undefined) {
      return;
    }

    const resolver = createReferenceCrossLinkResolver({ definitions });
    const display = projectSchemaCompositionDisplay(
      {
        oneOf: [
          nodeA.address,
          {
            publicArtifactId: nodeA.address.publicArtifactId,
            pointer: "/components/schemas/DoesNotExist",
          },
        ],
      },
      {
        pagePath: PAGE_PATH,
        resolve: (target) => {
          if (target.pointer === nodeA.address.pointer) {
            return resolver.resolveRefChain({
              source: w04FixtureSource("/components/schemas/Root"),
              ref: target,
            });
          }
          return resolver.resolveRef({
            source: w04FixtureSource("/components/schemas/Root"),
            ref: target,
          });
        },
      },
    );

    render(<SchemaComposition display={display} />);

    expect(
      screen.getByRole("link", { name: /cyclic reference/i }),
    ).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("(unresolved)")).toBeTruthy();
  });
});

describe("SchemaFieldTree $ref links", () => {
  test("renders SchemaRefLink instead of expanding $ref targets", () => {
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

    render(<SchemaFieldTree nodes={nodes} pagePath={PAGE_PATH} />);

    const link = screen.getByRole("link", {
      name: /schema reference: \/\$defs\/Worker/i,
    });
    expect(link.getAttribute("href")).toContain(PAGE_PATH);
    expect(link.className).toContain("text-secondary");
    expect(link.className).not.toMatch(/\btext-primary\b/);
    expect(
      screen.queryByRole("button", { name: /Expand fields under worker/i }),
    ).toBeNull();
    expect(screen.queryByText("worker.name")).toBeNull();
  });
});
