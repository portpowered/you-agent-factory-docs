import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ContractSourceBadge } from "./ContractSourceBadge";
import { ReferenceEmptyState } from "./ReferenceEmptyState";
import { ReferenceErrorState } from "./ReferenceErrorState";
import { ReferenceLifecycleVisibility } from "./ReferenceLifecycleVisibility";

afterEach(() => {
  cleanup();
});

const fixtureSource = {
  publicArtifactId: "cli",
  pointer: "/commands/0",
  path: "generated/cli/commands.json",
} as const;

describe("ContractSourceBadge", () => {
  test("renders family, lifecycle, package version, and source as readable chrome", () => {
    render(
      <ContractSourceBadge
        family="cli"
        lifecycle={{ state: "active", since: "0.0.0" }}
        packageVersion="0.0.0"
        source={fixtureSource}
        visibility="public"
      />,
    );

    const badge = screen.getByRole("complementary", {
      name: /Contract source/i,
    });
    expect(badge.getAttribute("data-contract-source-badge")).toBe("");
    expect(badge.getAttribute("data-reference-family")).toBe("cli");
    expect(badge.getAttribute("data-package-version")).toBe("0.0.0");
    expect(badge.getAttribute("data-source-artifact")).toBe("cli");
    expect(badge.getAttribute("data-lifecycle-state")).toBe("active");
    expect(badge.getAttribute("data-visibility")).toBe("public");

    expect(screen.getByText("Family")).toBeTruthy();
    expect(screen.getByText("CLI")).toBeTruthy();
    expect(screen.getByText("Package version")).toBeTruthy();
    expect(screen.getByText("0.0.0")).toBeTruthy();
    expect(screen.getByText("Source artifact")).toBeTruthy();
    expect(screen.getByText("cli (generated/cli/commands.json)")).toBeTruthy();
    expect(screen.getByText("Lifecycle: Active")).toBeTruthy();
    expect(screen.getByText("Visibility: Public")).toBeTruthy();
  });

  test("discloses missing package version instead of inventing one", () => {
    render(
      <ContractSourceBadge
        family="mcp"
        source={{
          publicArtifactId: "mcp",
          pointer: "/tools/0",
        }}
      />,
    );

    expect(screen.getByText("Not published on this projection")).toBeTruthy();
    expect(
      screen.getByRole("complementary", {
        name: /package version not published/i,
      }),
    ).toBeTruthy();
  });
});

describe("ReferenceLifecycleVisibility", () => {
  test("presents lifecycle and visibility with text and icons, not color alone", () => {
    const { container } = render(
      <ReferenceLifecycleVisibility
        lifecycle={{ state: "deprecated", deprecated: "1.0.0" }}
        visibility="internal"
      />,
    );

    expect(
      container.querySelector("[data-reference-status-chrome]"),
    ).toBeTruthy();
    expect(screen.getByText("Lifecycle: Deprecated")).toBeTruthy();
    expect(screen.getByText("Visibility: Internal")).toBeTruthy();
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
    expect(
      container.querySelector("[data-lifecycle-state='deprecated']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-visibility='internal']"),
    ).toBeTruthy();
  });

  test("returns null when neither lifecycle nor visibility is published", () => {
    const { container } = render(<ReferenceLifecycleVisibility />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ReferenceEmptyState", () => {
  test("renders accessible empty messaging for missing inventories", () => {
    render(
      <ReferenceEmptyState
        description="No published CLI commands were found in the resolved contract."
        family="cli"
        title="No CLI commands"
      />,
    );

    const panel = screen.getByRole("status");
    expect(panel.getAttribute("data-reference-empty-state")).toBe("");
    expect(panel.getAttribute("data-reference-family")).toBe("cli");
    expect(screen.getByText("No CLI commands")).toBeTruthy();
    expect(
      screen.getByText(
        "No published CLI commands were found in the resolved contract.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Family: CLI")).toBeTruthy();
    expect(screen.getByText("Empty")).toBeTruthy();
  });
});

describe("ReferenceErrorState", () => {
  test("renders accessible error messaging for malformed inventories", () => {
    render(
      <ReferenceErrorState
        description="The MCP inventory could not be normalized."
        detail={
          'Malformed family model: field "name" must be a non-empty string.'
        }
        family="mcp"
        title="MCP inventory error"
      />,
    );

    const panel = screen.getByRole("alert");
    expect(panel.getAttribute("data-reference-error-state")).toBe("");
    expect(panel.getAttribute("data-reference-family")).toBe("mcp");
    expect(screen.getByText("MCP inventory error")).toBeTruthy();
    expect(
      screen.getByText("The MCP inventory could not be normalized."),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Malformed family model: field "name" must be a non-empty string.',
      ),
    ).toBeTruthy();
    expect(screen.getByText("Family: MCP")).toBeTruthy();
    expect(screen.getByText("Error")).toBeTruthy();
  });
});
