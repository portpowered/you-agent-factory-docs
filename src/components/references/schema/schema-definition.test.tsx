import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  SchemaBreadcrumb,
  SchemaDefinition,
  schemaAddressDeepLink,
  schemaPointerAnchor,
  schemaPointerBreadcrumbSegments,
} from "@/components/references/schema";
import {
  buildCompositionDefinitions,
  buildMissingDescriptionDefinition,
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
  mock.restore();
});

function installClipboardMock() {
  const writeText = mock((text: string) => {
    void text;
    return Promise.resolve();
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: {
      writeText: (text: string) => writeText(text),
    },
  });
  return writeText;
}

const FACTORY_ARTIFACT = "@you-agent-factory/api/schemas/factory";
const PAGE_PATH = "/docs/references/schema";

function address(pointer: string) {
  return { publicArtifactId: FACTORY_ARTIFACT, pointer };
}

describe("schemaAddressDeepLink / schemaPointerBreadcrumbSegments", () => {
  test("derives W04 anchors and path segments without inventing ids", () => {
    const pointer = "/components/schemas/Worker";
    const deepLink = schemaAddressDeepLink(address(pointer), PAGE_PATH);
    const expectedAnchor = schemaPointerAnchor(pointer);

    expect(deepLink.anchor).toBe(expectedAnchor);
    expect(deepLink.href).toBe(`${PAGE_PATH}#${expectedAnchor}`);
    expect(deepLink.copyValue).toBe(`${PAGE_PATH}#${expectedAnchor}`);
    expect(schemaPointerBreadcrumbSegments(pointer)).toEqual([
      "components",
      "schemas",
      "Worker",
    ]);
  });

  test("copies fragment-only when pagePath is omitted", () => {
    const deepLink = schemaAddressDeepLink(address("/$defs/Session"));
    expect(deepLink.href).toBeUndefined();
    expect(deepLink.copyValue).toBe(`#${deepLink.anchor}`);
  });
});

describe("SchemaBreadcrumb", () => {
  test("copies the deep-link href on click", async () => {
    const writeText = installClipboardMock();
    const anchor = schemaPointerAnchor("/$defs/Worker");

    render(
      <SchemaBreadcrumb
        anchor={anchor}
        href={`${PAGE_PATH}#${anchor}`}
        segments={["$defs", "Worker"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy deep link" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${PAGE_PATH}#${anchor}`);
    });
  });
});

describe("SchemaDefinition", () => {
  test("renders metadata, composition, fields, and copyable definition anchor", async () => {
    const writeText = installClipboardMock();
    const definitions = buildCompositionDefinitions();
    const contentPart = definitions.find(
      (definition) => definition.title === "WorkContentPart",
    );
    expect(contentPart).toBeTruthy();
    if (contentPart === undefined) {
      return;
    }

    const resolver = createReferenceCrossLinkResolver({ definitions });
    const projection = projectSchemaDefinitionToDisplay(contentPart, {
      id: "schema.def.WorkContentPart",
      family: "schema",
      anchor: schemaPointerAnchor(contentPart.address.pointer),
      source: w04FixtureSource(contentPart.address.pointer),
      pagePath: PAGE_PATH,
    });

    render(
      <SchemaDefinition
        defaultExpanded
        definition={contentPart}
        pagePath={PAGE_PATH}
        projection={projection}
        resolve={(target) =>
          resolver.resolveRef({
            source: w04FixtureSource(contentPart.address.pointer),
            ref: target,
          })
        }
      />,
    );

    const article = screen.getByTestId("schema-definition");
    expect(article.getAttribute("id")).toBe(projection.anchor);
    expect(
      screen.getByRole("heading", { level: 2, name: "WorkContentPart" }),
    ).toBeTruthy();
    expect(screen.getByText("Discriminated content part union.")).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Schema composition" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "oneOf composition" }),
    ).toBeTruthy();

    const definitionBreadcrumb = screen.getByRole("navigation", {
      name: "Deep link for WorkContentPart",
    });
    expect(definitionBreadcrumb.getAttribute("data-schema-deep-link")).toBe(
      `${PAGE_PATH}#${projection.anchor}`,
    );
    fireEvent.click(
      within(definitionBreadcrumb).getByRole("button", {
        name: "Copy deep link",
      }),
    );
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${PAGE_PATH}#${projection.anchor}`,
      );
    });
  });

  test("omits missing description rather than inventing contract prose", () => {
    const definition = buildMissingDescriptionDefinition();
    render(<SchemaDefinition definition={definition} pagePath={PAGE_PATH} />);

    expect(
      screen
        .getByTestId("schema-definition")
        .querySelector("[data-schema-definition-description]"),
    ).toBeNull();
    expect(screen.queryByText(/undefined/i)).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: "AnonymousPayload" }),
    ).toBeTruthy();
  });

  test("does not invent field deep links when the field has no address", () => {
    const definition = createSchemaDefinitionModel({
      address: address("/$defs/NoFieldAddress"),
      title: "NoFieldAddress",
      type: "object",
      properties: {
        bare: createSchemaFieldModel({
          path: "bare",
          typeSummary: "string",
          required: false,
        }),
      },
    });

    render(<SchemaDefinition definition={definition} pagePath={PAGE_PATH} />);

    expect(screen.getByTestId("schema-field-tree")).toBeTruthy();
    expect(
      screen.queryByRole("navigation", {
        name: "Deep link for field bare",
      }),
    ).toBeNull();
  });

  test("renders field tree and copyable field anchors from W04 addresses", async () => {
    const writeText = installClipboardMock();
    const fieldPointer =
      "/components/schemas/WorkTextContentPart/properties/text";
    const definition = createSchemaDefinitionModel({
      address: address("/components/schemas/WorkTextContentPart"),
      title: "WorkTextContentPart",
      description: "Text content part.",
      type: "object",
      properties: {
        text: createSchemaFieldModel({
          path: "text",
          address: address(fieldPointer),
          typeSummary: "string",
          required: true,
          description: "Plain text payload.",
        }),
      },
    });

    render(<SchemaDefinition definition={definition} pagePath={PAGE_PATH} />);

    expect(screen.getByText("Plain text payload.")).toBeTruthy();
    expect(screen.getByTestId("schema-field-tree")).toBeTruthy();

    const fieldAnchor = schemaPointerAnchor(fieldPointer);
    const fieldBreadcrumb = screen.getByRole("navigation", {
      name: "Deep link for field text",
    });
    expect(fieldBreadcrumb.getAttribute("data-schema-anchor")).toBe(
      fieldAnchor,
    );
    fireEvent.click(
      within(fieldBreadcrumb).getByRole("button", { name: "Copy deep link" }),
    );
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${PAGE_PATH}#${fieldAnchor}`);
    });
  });

  test("falls back to pointer leaf title when title and description are absent", () => {
    const definition = createSchemaDefinitionModel({
      address: address("/$defs/AnonymousNode"),
      type: "object",
    });

    render(<SchemaDefinition definition={definition} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "AnonymousNode" }),
    ).toBeTruthy();
    expect(
      screen
        .queryByTestId("schema-definition")
        ?.querySelector("[data-schema-definition-description]"),
    ).toBeNull();
  });
});
