import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  formatSchemaValue,
  listSchemaConstraintEntries,
  SchemaConstraintList,
  SchemaDefaultValue,
  SchemaRequiredBadge,
  SchemaTypeBadge,
  schemaConstraintListPropsFromField,
  schemaTypeBadgePropsFromProjection,
} from "@/components/references/schema";
import { projectSchemaFieldToDisplay } from "@/lib/references/reference-display-projection";
import { createSchemaFieldModel } from "@/lib/references/schema-model";

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

function sampleFieldProjection(
  overrides: Parameters<typeof createSchemaFieldModel>[0] = {
    path: "sessionId",
    typeSummary: "string",
    required: true,
    format: "uuid",
    nullable: true,
    default: "00000000-0000-0000-0000-000000000000",
    enum: ["a", "b"],
    constraints: { minLength: 1, maxLength: 36, pattern: "^[a-z]+$" },
  },
) {
  const field = createSchemaFieldModel(overrides);
  const projection = projectSchemaFieldToDisplay(field, {
    id: "field-sessionId",
    family: "schema",
    anchor: "defs-worker-sessionId",
    source: {
      publicArtifactId: FACTORY_ARTIFACT,
      pointer: "/$defs/Worker/properties/sessionId",
    },
  });
  return { field, projection };
}

describe("SchemaTypeBadge", () => {
  test("renders type, format, and nullable text from a display projection", () => {
    const { projection } = sampleFieldProjection();
    render(
      <SchemaTypeBadge {...schemaTypeBadgePropsFromProjection(projection)} />,
    );

    expect(screen.getByText("string")).toBeTruthy();
    expect(screen.getByText("format: uuid")).toBeTruthy();
    expect(screen.getByText("nullable")).toBeTruthy();
    expect(
      screen
        .getByTestId("schema-type-badge")
        .querySelector('[data-schema-type="summary"]'),
    ).toBeTruthy();
  });

  test("omits absent type facts instead of inventing them", () => {
    const { container } = render(<SchemaTypeBadge />);
    expect(container.firstChild).toBeNull();
  });
});

describe("SchemaRequiredBadge", () => {
  test("shows Required text for required fields", () => {
    render(<SchemaRequiredBadge required />);
    const badge = screen.getByTestId("schema-required-badge");
    expect(badge.textContent).toContain("Required");
    expect(badge.getAttribute("data-schema-required")).toBe("true");
  });

  test("shows Optional text for optional fields (never color-only)", () => {
    render(<SchemaRequiredBadge required={false} />);
    const badge = screen.getByTestId("schema-required-badge");
    expect(badge.textContent).toContain("Optional");
    expect(badge.getAttribute("data-schema-required")).toBe("false");
  });
});

describe("SchemaDefaultValue", () => {
  test("renders code-formatted default with copy support", async () => {
    const writeText = installClipboardMock();
    const value = { enabled: true, retries: 3 };

    render(<SchemaDefaultValue value={value} />);

    expect(screen.getByText("Default")).toBeTruthy();
    const code = screen
      .getByTestId("schema-default-value")
      .querySelector('[data-schema-default="value"]');
    expect(code?.textContent).toBe(formatSchemaValue(value));

    fireEvent.click(screen.getByRole("button", { name: "Copy default value" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toBe(
      formatSchemaValue(value),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Copied default value" }),
      ).toBeTruthy();
    });
  });

  test("returns null when no default is present", () => {
    const { container } = render(<SchemaDefaultValue value={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("SchemaConstraintList", () => {
  test("renders enum, const, pattern, range, length, items, uniqueness, and additionalProperties", () => {
    const field = createSchemaFieldModel({
      path: "tags",
      typeSummary: "array",
      required: false,
      enum: ["alpha", "beta"],
      const: "alpha",
      constraints: {
        pattern: "^[a-z]+$",
        minimum: 0,
        maximum: 10,
        exclusiveMinimum: -1,
        exclusiveMaximum: 11,
        multipleOf: 2,
        minLength: 1,
        maxLength: 8,
        minItems: 1,
        maxItems: 5,
        uniqueItems: true,
        minProperties: 1,
        maxProperties: 4,
      },
      additionalProperties: false,
    });

    render(
      <SchemaConstraintList {...schemaConstraintListPropsFromField(field)} />,
    );

    const list = screen.getByRole("list", { name: "Schema constraints" });
    expect(list).toBeTruthy();

    for (const key of [
      "enum",
      "const",
      "pattern",
      "minimum",
      "maximum",
      "exclusiveMinimum",
      "exclusiveMaximum",
      "multipleOf",
      "minLength",
      "maxLength",
      "minItems",
      "maxItems",
      "uniqueItems",
      "minProperties",
      "maxProperties",
      "additionalProperties",
    ]) {
      expect(
        list.querySelector(`[data-schema-constraint="${key}"]`),
      ).toBeTruthy();
    }

    expect(screen.getByText(/"alpha" \| "beta"/)).toBeTruthy();
    expect(screen.getByText("false (closed)")).toBeTruthy();
  });

  test("omits the list when no constraints are published", () => {
    const { container } = render(<SchemaConstraintList />);
    expect(container.firstChild).toBeNull();
    expect(listSchemaConstraintEntries({})).toEqual([]);
  });

  test("does not invent constraint values for sparse models", () => {
    const entries = listSchemaConstraintEntries({
      constraints: { minLength: 2 },
    });
    expect(entries).toEqual([
      { key: "minLength", label: "minLength", value: "2" },
    ]);
    expect(entries.some((entry) => entry.key === "pattern")).toBe(false);
    expect(entries.some((entry) => entry.key === "enum")).toBe(false);
  });
});
