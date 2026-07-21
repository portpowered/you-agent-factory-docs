import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import {
  SCHEMA_UI_STATUS_DEFAULT_MESSAGES,
  SCHEMA_UI_STATUS_KINDS,
  SchemaStatus,
  SchemaSurface,
} from "@/features/references/schema";
import { projectSchemaDefinitionToDisplay } from "@/lib/references/reference-display-projection";
import { createSchemaDefinitionModel } from "@/lib/references/schema-model";

afterEach(() => {
  cleanup();
});

describe("schema UI ownership surface", () => {
  test("exports the four non-ready status kinds", () => {
    expect([...SCHEMA_UI_STATUS_KINDS]).toEqual([
      "loading",
      "empty",
      "invalid",
      "unsupported",
    ]);
  });

  test("SchemaStatus loading uses an accessible status region", () => {
    render(
      <SchemaStatus
        kind="loading"
        message={SCHEMA_UI_STATUS_DEFAULT_MESSAGES.loading}
      />,
    );

    const region = screen.getByRole("status", { name: "Loading" });
    expect(region.getAttribute("data-schema-status")).toBe("loading");
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(
      screen.getByText(SCHEMA_UI_STATUS_DEFAULT_MESSAGES.loading),
    ).toBeTruthy();
  });

  test("SchemaStatus empty uses an accessible status region", () => {
    render(
      <SchemaStatus
        kind="empty"
        message="No definitions were published for this artifact."
        title="Empty definitions"
      />,
    );

    const region = screen.getByRole("status", { name: "Empty definitions" });
    expect(region.getAttribute("data-schema-status")).toBe("empty");
    expect(
      screen.getByText("No definitions were published for this artifact."),
    ).toBeTruthy();
  });

  test("SchemaStatus invalid uses an accessible alert", () => {
    render(
      <SchemaStatus
        kind="invalid"
        message="Normalization rejected the supplied schema model."
        title="Invalid input"
      />,
    );

    const alert = screen.getByRole("alert", { name: "Invalid input" });
    expect(alert.getAttribute("data-schema-status")).toBe("invalid");
    expect(
      screen.getByText("Normalization rejected the supplied schema model."),
    ).toBeTruthy();
  });

  test("SchemaStatus unsupported uses an accessible alert", () => {
    render(
      <SchemaStatus
        kind="unsupported"
        message="Draft-04 schemas are not supported on this surface."
      />,
    );

    const alert = screen.getByRole("alert", { name: "Unsupported schema" });
    expect(alert.getAttribute("data-schema-status")).toBe("unsupported");
    expect(
      screen.getByText("Draft-04 schemas are not supported on this surface."),
    ).toBeTruthy();
  });
});

describe("SchemaSurface", () => {
  test("short-circuits non-ready statuses to SchemaStatus messaging", () => {
    render(
      <SchemaSurface
        status="empty"
        statusMessage="Nothing to show."
        statusTitle="Empty"
      >
        <p>should not render</p>
      </SchemaSurface>,
    );

    expect(screen.getByRole("status", { name: "Empty" })).toBeTruthy();
    expect(screen.getByText("Nothing to show.")).toBeTruthy();
    expect(screen.queryByText("should not render")).toBeNull();
  });

  test("ready status renders children and accepts W04 display adapters", () => {
    const definition = createSchemaDefinitionModel({
      address: {
        publicArtifactId: "@you-agent-factory/api/schemas/factory",
        pointer: "/$defs/Worker",
      },
      title: "Worker",
      description: "A worker definition.",
      type: "object",
    });
    const projection = projectSchemaDefinitionToDisplay(definition, {
      id: "worker",
      family: "schema",
      anchor: "defs-worker",
      source: {
        publicArtifactId: definition.address.publicArtifactId,
        pointer: definition.address.pointer,
      },
    });

    render(
      <SchemaSurface
        definition={{ definition }}
        display={{ projection }}
        status="ready"
      >
        <p>{projection.title}</p>
        <p>{projection.description}</p>
      </SchemaSurface>,
    );

    const surface = screen.getByTestId("schema-surface");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(screen.getByText("Worker")).toBeTruthy();
    expect(screen.getByText("A worker definition.")).toBeTruthy();
  });

  test("invalid surface never renders a blank panel", () => {
    render(<SchemaSurface status="invalid" />);

    const alert = screen.getByRole("alert");
    expect(alert.textContent?.trim().length).toBeGreaterThan(0);
    expect(alert.getAttribute("data-schema-status")).toBe("invalid");
  });
});
