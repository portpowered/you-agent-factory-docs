import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import {
  collectSchemaReferenceCatalog,
  findSchemaDefinitionByAddress,
  resolveSchemaReferenceInput,
  SchemaReference,
  schemaAddressesEqual,
  schemaPointerAnchor,
} from "@/components/references/schema";
import {
  buildCompositionDefinitions,
  w04FixtureSource,
} from "@/lib/references/fixtures/w04-normalized-model-fixtures";
import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import { projectSchemaDefinitionToDisplay } from "@/lib/references/reference-display-projection";
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

function makeRootWithDefs() {
  const worker = createSchemaDefinitionModel({
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
    },
  });
  const session = createSchemaDefinitionModel({
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
  });
  const root = createSchemaDefinitionModel({
    address: address("/schemas/FactorySchema"),
    title: "FactorySchema",
    description: "Root factory schema",
    type: "object",
    properties: {
      version: createSchemaFieldModel({
        path: "version",
        required: true,
        typeSummary: "string",
      }),
    },
    definitions: {
      Worker: worker,
      Session: session,
    },
    examples: [{ version: "1.0.0" }],
  });
  return { root, worker, session };
}

describe("resolveSchemaReferenceInput", () => {
  test("resolves complete mode from root + nested definitions", () => {
    const { root, worker, session } = makeRootWithDefs();
    const resolved = resolveSchemaReferenceInput({ root });

    expect(resolved.status).toBe("ready");
    if (resolved.status !== "ready") {
      return;
    }
    expect(resolved.mode).toBe("complete");
    expect(resolved.definition.title).toBe("FactorySchema");
    expect(resolved.catalog.map((entry) => entry.title).sort()).toEqual([
      "Session",
      "Worker",
    ]);
    expect(schemaAddressesEqual(worker.address, address("/$defs/Worker"))).toBe(
      true,
    );
    expect(
      findSchemaDefinitionByAddress(session.address, { root })?.title,
    ).toBe("Session");
  });

  test("resolves addressed mode from address + catalog", () => {
    const { root, worker } = makeRootWithDefs();
    const resolved = resolveSchemaReferenceInput({
      root,
      address: worker.address,
    });

    expect(resolved.status).toBe("ready");
    if (resolved.status !== "ready") {
      return;
    }
    expect(resolved.mode).toBe("addressed");
    expect(resolved.definition.title).toBe("Worker");
  });

  test("missing address yields invalid status without throwing", () => {
    const { root } = makeRootWithDefs();
    const resolved = resolveSchemaReferenceInput({
      root,
      address: address("/$defs/Missing"),
    });

    expect(resolved.status).toBe("invalid");
    if (resolved.status === "ready") {
      return;
    }
    expect(resolved.title).toBe("Invalid address");
    expect(resolved.message).toContain("not found");
  });

  test("empty inputs yield empty status", () => {
    const resolved = resolveSchemaReferenceInput({});
    expect(resolved.status).toBe("empty");
  });

  test("explicit loading status short-circuits ready derivation", () => {
    const { root } = makeRootWithDefs();
    const resolved = resolveSchemaReferenceInput({
      root,
      status: "loading",
      statusMessage: "Still normalizing…",
    });
    expect(resolved.status).toBe("loading");
    if (resolved.status === "ready") {
      return;
    }
    expect(resolved.message).toBe("Still normalizing…");
  });

  test("collectSchemaReferenceCatalog indexes nested defs without mutation", () => {
    const { root, worker } = makeRootWithDefs();
    const before = Object.keys(root.definitions ?? {});
    const catalog = collectSchemaReferenceCatalog({ root });
    expect(catalog.map((entry) => entry.title).sort()).toEqual([
      "FactorySchema",
      "Session",
      "Worker",
    ]);
    expect(Object.keys(root.definitions ?? {})).toEqual(before);
    expect(findSchemaDefinitionByAddress(worker.address, { root })?.title).toBe(
      "Worker",
    );
  });
});

describe("SchemaReference", () => {
  test("renders complete schema with root, catalog definitions, filter, and examples", () => {
    const { root } = makeRootWithDefs();

    render(
      <SchemaReference
        pagePath={PAGE_PATH}
        root={root}
        showEmptyExamples={false}
      />,
    );

    const surface = screen.getByTestId("schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      screen
        .getByTestId("schema-reference")
        .querySelector('[data-schema-reference-mode="complete"]'),
    ).toBeTruthy();

    const primary = screen.getByTestId("schema-reference-definition");
    expect(
      within(primary).getByText("FactorySchema", { selector: "h2" }),
    ).toBeTruthy();
    expect(within(primary).getByText("Root factory schema")).toBeTruthy();
    expect(
      primary.querySelector('[data-schema-field-path="version"]'),
    ).toBeTruthy();

    const catalog = screen.getByRole("region", {
      name: "Schema definitions",
    });
    expect(
      within(catalog).getByText("Worker", { selector: "h2" }),
    ).toBeTruthy();
    expect(
      within(catalog).getByText("Session", { selector: "h2" }),
    ).toBeTruthy();

    expect(screen.getByLabelText(/Filter schema/i)).toBeTruthy();
    expect(within(primary).getByText("Examples")).toBeTruthy();
  });

  test("switches to addressed definition when address prop is set", () => {
    const { root, worker } = makeRootWithDefs();
    const projection = projectSchemaDefinitionToDisplay(worker, {
      id: "schema.def.Worker",
      family: "schema",
      anchor: schemaPointerAnchor(worker.address.pointer),
      source: w04FixtureSource(worker.address.pointer, {
        publicArtifactId: FACTORY_ARTIFACT,
        path: "schemas/factory.json",
      }),
      pagePath: PAGE_PATH,
    });

    const { rerender } = render(<SchemaReference root={root} />);
    expect(
      screen
        .getByTestId("schema-reference")
        .querySelector('[data-schema-reference-mode="complete"]'),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("schema-reference-definition")).getByText(
        "FactorySchema",
        { selector: "h2" },
      ),
    ).toBeTruthy();

    rerender(
      <SchemaReference
        address={worker.address}
        pagePath={PAGE_PATH}
        projection={projection}
        root={root}
      />,
    );

    expect(
      screen
        .getByTestId("schema-reference")
        .querySelector('[data-schema-reference-mode="addressed"]'),
    ).toBeTruthy();
    const addressed = screen.getByTestId("schema-reference-definition");
    expect(
      within(addressed).getByText("Worker", { selector: "h2" }),
    ).toBeTruthy();
    expect(
      within(addressed).getByText("A factory worker contract"),
    ).toBeTruthy();
    expect(
      screen
        .queryByTestId("schema-reference-definition")
        ?.getAttribute("data-schema-definition-pointer"),
    ).toBe("/$defs/Worker");
    expect(
      screen.queryByRole("region", { name: "Schema definitions" }),
    ).toBeNull();
  });

  test("missing address shows invalid status instead of crashing", () => {
    const { root } = makeRootWithDefs();

    render(
      <SchemaReference address={address("/$defs/DoesNotExist")} root={root} />,
    );

    const alert = screen.getByRole("alert", { name: "Invalid address" });
    expect(alert.getAttribute("data-schema-status")).toBe("invalid");
    expect(screen.getByText(/not found/i)).toBeTruthy();
    expect(screen.queryByText("FactorySchema")).toBeNull();
  });

  test("empty inputs show empty status", () => {
    render(<SchemaReference />);

    const region = screen.getByRole("status", { name: "Empty schema" });
    expect(region.getAttribute("data-schema-status")).toBe("empty");
  });

  test("composes composition, refs, and filter with W04 fixtures", () => {
    const definitions = buildCompositionDefinitions();
    const contentPart = definitions.find(
      (entry) => entry.title === "WorkContentPart",
    );
    expect(contentPart).toBeTruthy();
    if (contentPart === undefined) {
      return;
    }

    const resolver = createReferenceCrossLinkResolver({ definitions });

    render(
      <SchemaReference
        address={contentPart.address}
        definitions={definitions}
        pagePath={PAGE_PATH}
        resolve={(target) =>
          resolver.resolveRef({
            source: {
              publicArtifactId: contentPart.address.publicArtifactId,
              pointer: contentPart.address.pointer,
            },
            ref: target,
          })
        }
      />,
    );

    expect(
      screen
        .getByTestId("schema-reference")
        .querySelector('[data-schema-reference-mode="addressed"]'),
    ).toBeTruthy();
    const definition = screen.getByTestId("schema-reference-definition");
    expect(
      within(definition).getByText("WorkContentPart", { selector: "h2" }),
    ).toBeTruthy();

    const oneOf = definition.querySelector(
      '[data-schema-composition-kind="oneOf"]',
    );
    expect(oneOf).toBeTruthy();

    const filterInput = screen.getByLabelText(/Filter schema/i);
    fireEvent.change(filterInput, { target: { value: "zzzz-no-match" } });
    expect(screen.getByText(/No definitions or fields match/i)).toBeTruthy();
  });
});
