import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  annotateSchemaFieldTreeWithVariant,
  indexSchemaVariantFieldApplicability,
  isSchemaVariantOverlayPresentation,
  resolveSchemaVariantInput,
  SchemaVariantReference,
  schemaFieldTreeNodesFromProperties,
  schemaVariantApplicabilityLabel,
} from "@/components/references/schema";
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

function makeWorkerBase() {
  return createSchemaDefinitionModel({
    address: address("/$defs/Worker"),
    title: "Worker",
    description: "A factory worker contract",
    type: "object",
    properties: {
      name: createSchemaFieldModel({
        path: "name",
        required: true,
        typeSummary: "string",
        description: "Worker display name from base schema",
      }),
      type: createSchemaFieldModel({
        path: "type",
        required: false,
        typeSummary: "string",
        description: "Worker type discriminator",
      }),
      toolPolicy: createSchemaFieldModel({
        path: "toolPolicy",
        required: false,
        typeSummary: "object",
        description: "Explicit agent-loop tool policy",
      }),
      hostBinding: createSchemaFieldModel({
        path: "hostBinding",
        required: false,
        typeSummary: "string",
        description: "Hosted worker binding",
      }),
    },
  });
}

const agentOverlay = {
  variantLabel: "AGENT_WORKER",
  fields: [
    { path: "name", applicability: "selected" as const },
    { path: "type", applicability: "selected" as const },
    {
      path: "toolPolicy",
      applicability: "conditional" as const,
      hint: "When agent-loop tools are enabled",
    },
    { path: "hostBinding", applicability: "excluded" as const },
  ],
};

describe("schema variant display projectors", () => {
  test("labels applicability with text", () => {
    expect(schemaVariantApplicabilityLabel("selected")).toBe("Selected");
    expect(schemaVariantApplicabilityLabel("excluded")).toBe("Excluded");
    expect(schemaVariantApplicabilityLabel("conditional")).toBe("Conditional");
  });

  test("accepts overlay-shaped presentation and rejects malformed shapes", () => {
    expect(isSchemaVariantOverlayPresentation(agentOverlay)).toBe(true);
    expect(isSchemaVariantOverlayPresentation(null)).toBe(false);
    expect(isSchemaVariantOverlayPresentation({ fields: "nope" })).toBe(false);
    expect(
      isSchemaVariantOverlayPresentation({
        fields: [{ path: "name", applicability: "invented" }],
      }),
    ).toBe(false);
  });

  test("indexes applicability by path and annotates field trees without mutating models", () => {
    const base = makeWorkerBase();
    const nameBefore = base.properties?.name?.description;
    const byPath = indexSchemaVariantFieldApplicability(agentOverlay.fields);
    const nodes = schemaFieldTreeNodesFromProperties(base.properties ?? {});
    const annotated = annotateSchemaFieldTreeWithVariant(nodes, byPath);

    expect(byPath.get("toolPolicy")?.applicability).toBe("conditional");
    expect(
      annotated.find((node) => node.field.path === "toolPolicy")
        ?.variantApplicability,
    ).toBe("conditional");
    expect(
      annotated.find((node) => node.field.path === "toolPolicy")?.variantHint,
    ).toBe("When agent-loop tools are enabled");
    expect(
      annotated.find((node) => node.field.path === "hostBinding")
        ?.variantApplicability,
    ).toBe("excluded");
    expect(base.properties?.name?.description).toBe(nameBefore);
    expect(
      annotated.find((node) => node.field.path === "name")?.field.description,
    ).toBe("Worker display name from base schema");
  });

  test("resolveSchemaVariantInput yields invalid/empty when overlay or base is missing", () => {
    const base = makeWorkerBase();

    const missingOverlay = resolveSchemaVariantInput({ definition: base });
    expect(missingOverlay.status).toBe("invalid");

    const emptyFields = resolveSchemaVariantInput({
      definition: base,
      overlay: { variantLabel: "AGENT_WORKER", fields: [] },
    });
    expect(emptyFields.status).toBe("empty");

    const noBase = resolveSchemaVariantInput({ overlay: agentOverlay });
    expect(noBase.status).toBe("empty");

    const ready = resolveSchemaVariantInput({
      definition: base,
      overlay: agentOverlay,
    });
    expect(ready.status).toBe("ready");
    if (ready.status !== "ready") {
      return;
    }
    expect(ready.overlay.variantLabel).toBe("AGENT_WORKER");
    expect(ready.applicabilityByPath.get("name")?.applicability).toBe(
      "selected",
    );
  });
});

describe("SchemaVariantReference", () => {
  test("renders base field prose with selected/excluded/conditional badges", () => {
    const base = makeWorkerBase();
    render(<SchemaVariantReference definition={base} overlay={agentOverlay} />);

    const surface = screen.getByTestId("schema-variant-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(screen.getByText("Variant: AGENT_WORKER")).toBeTruthy();

    const definition = screen.getByTestId(
      "schema-variant-reference-definition",
    );
    expect(
      within(definition).getByText("Worker display name from base schema"),
    ).toBeTruthy();
    expect(
      within(definition).getByText("Explicit agent-loop tool policy"),
    ).toBeTruthy();

    expect(screen.getAllByText("Selected").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Excluded")).toBeTruthy();
    expect(screen.getByText("Conditional")).toBeTruthy();
    expect(screen.getByText("When agent-loop tools are enabled")).toBeTruthy();

    const hostRow = screen
      .getAllByTestId("schema-field-row")
      .find(
        (row) => row.getAttribute("data-schema-field-path") === "hostBinding",
      );
    expect(hostRow).toBeTruthy();
    expect(
      hostRow?.querySelector('[data-schema-variant-applicability="excluded"]'),
    ).toBeTruthy();
  });

  test("does not invent field descriptions from overlay hints", () => {
    const base = createSchemaDefinitionModel({
      address: address("/$defs/Worker"),
      title: "Worker",
      type: "object",
      properties: {
        name: createSchemaFieldModel({
          path: "name",
          required: true,
          typeSummary: "string",
        }),
      },
    });

    render(
      <SchemaVariantReference
        definition={base}
        overlay={{
          variantLabel: "SCRIPT_WORKER",
          fields: [
            {
              path: "name",
              applicability: "selected",
              hint: "Overlay-only hint",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Overlay-only hint")).toBeTruthy();
    expect(screen.queryByText("Overlay-only hint")?.tagName).toBe("P");
    const description = screen
      .getByTestId("schema-variant-reference-definition")
      .querySelector("[data-schema-field-description]");
    expect(description).toBeNull();
  });

  test("shows invalid when overlay is missing and empty when fields are empty", () => {
    const base = makeWorkerBase();

    const { rerender } = render(
      <SchemaVariantReference definition={base} overlay={null} />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Invalid overlay")).toBeTruthy();

    rerender(
      <SchemaVariantReference
        definition={base}
        overlay={{ variantLabel: "AGENT_WORKER", fields: [] }}
      />,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Empty variant")).toBeTruthy();
  });

  test("explicit unsupported status short-circuits without pretending to validate", () => {
    render(
      <SchemaVariantReference
        definition={makeWorkerBase()}
        overlay={agentOverlay}
        status="unsupported"
        statusMessage="Overlay shape is not displayable."
        statusTitle="Unsupported overlay"
      />,
    );

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Unsupported overlay")).toBeTruthy();
    expect(screen.queryByText("Variant: AGENT_WORKER")).toBeNull();
  });

  test("opts out of Variant heading and pointer breadcrumb chrome when requested", () => {
    const base = makeWorkerBase();
    render(
      <SchemaVariantReference
        definition={base}
        overlay={agentOverlay}
        showPointerBreadcrumb={false}
        showVariantHeading={false}
      />,
    );

    expect(screen.queryByText("Variant: AGENT_WORKER")).toBeNull();
    expect(document.querySelector("[data-schema-variant-heading]")).toBeNull();
    const definition = screen.getByTestId(
      "schema-variant-reference-definition",
    );
    expect(
      definition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();
    expect(screen.queryByText("$defs")).toBeNull();
    expect(
      screen.getByText("Worker display name from base schema"),
    ).toBeTruthy();
    expect(screen.getAllByText("Selected").length).toBeGreaterThanOrEqual(2);
  });
});
