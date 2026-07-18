import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";
import { CliCapabilityNotice } from "./CliCapabilityNotice";
import { CliCommandInventory } from "./CliCommandInventory";
import {
  CliCommandReference,
  cliCommandInventoryIdentities,
} from "./CliCommandReference";
import {
  CLI_STRUCTURED_OPTIONS_UNAVAILABLE_DESCRIPTION,
  CLI_STRUCTURED_OPTIONS_UNAVAILABLE_TITLE,
  type CliCommandWithStructuredOptions,
  cliCommandHasStructuredOptions,
} from "./cli-capability";
import {
  cliVisibilityDisplayLabel,
  mapCliVisibilityToReferenceVisibility,
} from "./cli-visibility";

afterEach(() => {
  cleanup();
});

function fixtureCommand(
  overrides: Partial<CliCommandNormalized> = {},
): CliCommandNormalized {
  return {
    id: "you.config.init",
    name: "init",
    commandPath: "you config init",
    aliases: ["bootstrap"],
    description: "Create operator/system config on a fresh home",
    shortDescription: "Create operator/system config on a fresh home",
    longDescription:
      "Create operator/system config on a fresh home.\n\nUse after install.",
    example: "  you config init",
    visibility: "visible",
    runnable: true,
    handlerPresent: true,
    lifecycle: { state: "active", since: "0.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/cli",
      pointer: "/commands/2",
      path: "generated/cli/commands.json",
    },
    anchor: "you-config-init",
    ...overrides,
  };
}

describe("cli-visibility helpers", () => {
  test("maps published visible/public to shared public chrome", () => {
    expect(mapCliVisibilityToReferenceVisibility("visible")).toBe("public");
    expect(mapCliVisibilityToReferenceVisibility("public")).toBe("public");
    expect(mapCliVisibilityToReferenceVisibility("internal")).toBe("internal");
    expect(mapCliVisibilityToReferenceVisibility("mystery")).toBeUndefined();
  });

  test("formats published visibility for display without inventing values", () => {
    expect(cliVisibilityDisplayLabel("visible")).toBe("Visible");
  });
});

describe("CliCommandReference", () => {
  test("renders available metadata from a normalized CLI projection", () => {
    const { container } = render(
      <CliCommandReference command={fixtureCommand()} packageVersion="0.0.0" />,
    );

    const article = container.querySelector("[data-cli-command-reference]");
    expect(article).toBeTruthy();
    expect(article?.getAttribute("data-cli-command-path")).toBe(
      "you config init",
    );
    expect(article?.getAttribute("id")).toBe("you-config-init");

    expect(
      screen.getByRole("heading", { name: "you config init" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Create operator/system config on a fresh home"),
    ).toBeTruthy();
    expect(screen.getByText("Aliases")).toBeTruthy();
    expect(screen.getByText("bootstrap")).toBeTruthy();
    expect(screen.getByText("Visibility")).toBeTruthy();
    expect(screen.getByText("Visible")).toBeTruthy();
    expect(screen.getByText("Runnable")).toBeTruthy();
    expect(screen.getByText("Handler present")).toBeTruthy();
    expect(screen.getAllByText("Yes").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Long description")).toBeTruthy();
    expect(screen.getByText("Example")).toBeTruthy();
    expect(
      container.querySelector("[data-cli-example-code]")?.textContent,
    ).toContain("you config init");
    expect(screen.getByText("0.0.0")).toBeTruthy();
    expect(screen.getByText("Lifecycle: Active")).toBeTruthy();
  });

  test("omits optional metadata when the projection left it absent", () => {
    render(
      <CliCommandReference
        command={fixtureCommand({
          aliases: [],
          description: undefined,
          shortDescription: undefined,
          longDescription: undefined,
          example: undefined,
          visibility: undefined,
          runnable: undefined,
          handlerPresent: undefined,
          lifecycle: undefined,
        })}
      />,
    );

    expect(screen.queryByText("Aliases")).toBeNull();
    expect(screen.queryByText("Visibility")).toBeNull();
    expect(screen.queryByText("Runnable")).toBeNull();
    expect(screen.queryByText("Handler present")).toBeNull();
    expect(screen.queryByText("Long description")).toBeNull();
    expect(screen.queryByText("Example")).toBeNull();
    expect(screen.getByText("Not published on this projection")).toBeTruthy();
  });

  test("shows CliCapabilityNotice when structured flags/arguments are absent", () => {
    const { container } = render(
      <CliCommandReference command={fixtureCommand()} />,
    );

    expect(
      container.querySelector("[data-cli-capability-notice]"),
    ).toBeTruthy();
    expect(
      screen.getByText(CLI_STRUCTURED_OPTIONS_UNAVAILABLE_TITLE),
    ).toBeTruthy();
    expect(
      screen.getByText(CLI_STRUCTURED_OPTIONS_UNAVAILABLE_DESCRIPTION),
    ).toBeTruthy();
    expect(screen.getByText("Flags and arguments")).toBeTruthy();
    // Visible status chrome — not hover-only.
    expect(screen.getByRole("status")).toBeTruthy();
    // Does not invent option rows.
    expect(screen.queryByText("--help")).toBeNull();
    expect(screen.queryByText("--json")).toBeNull();
    expect(screen.queryByText("Defaults")).toBeNull();
    expect(screen.queryByText("Conflicts")).toBeNull();
  });

  test("hides CliCapabilityNotice when structured options exist on the projection", () => {
    const enriched: CliCommandWithStructuredOptions = {
      ...fixtureCommand(),
      flags: [{ name: "--dry-run" }],
    };

    const { container } = render(<CliCommandReference command={enriched} />);

    expect(container.querySelector("[data-cli-capability-notice]")).toBeNull();
    expect(
      screen.queryByText(CLI_STRUCTURED_OPTIONS_UNAVAILABLE_TITLE),
    ).toBeNull();
    // Still does not invent rendered option rows in this story.
    expect(screen.queryByText("--dry-run")).toBeNull();
  });
});

describe("cliCommandHasStructuredOptions", () => {
  test("treats missing and empty option bags as unavailable", () => {
    expect(cliCommandHasStructuredOptions(fixtureCommand())).toBe(false);
    expect(
      cliCommandHasStructuredOptions({
        ...fixtureCommand(),
        flags: [],
        arguments: [],
      }),
    ).toBe(false);
  });

  test("detects non-empty flags or arguments without inventing values", () => {
    expect(
      cliCommandHasStructuredOptions({
        ...fixtureCommand(),
        flags: [{ name: "--verbose" }],
      }),
    ).toBe(true);
    expect(
      cliCommandHasStructuredOptions({
        ...fixtureCommand(),
        arguments: [{ name: "path" }],
      }),
    ).toBe(true);
  });
});

describe("CliCapabilityNotice", () => {
  test("renders accessible visible disclosure copy", () => {
    const { container } = render(<CliCapabilityNotice />);

    expect(
      container.querySelector(
        '[data-cli-capability="structured-options-unavailable"]',
      ),
    ).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(
      screen.getByText(CLI_STRUCTURED_OPTIONS_UNAVAILABLE_TITLE),
    ).toBeTruthy();
    expect(
      screen.getByText(CLI_STRUCTURED_OPTIONS_UNAVAILABLE_DESCRIPTION),
    ).toBeTruthy();
  });
});

describe("CliCommandInventory", () => {
  test("renders every command from normalized projections", () => {
    const commands = [
      fixtureCommand(),
      fixtureCommand({
        id: "you",
        name: "you",
        commandPath: "you",
        aliases: [],
        anchor: "you",
        example: undefined,
        longDescription: undefined,
        shortDescription: "Run factories",
        description: "Run factories",
      }),
    ];

    render(
      <CliCommandInventory
        inventory={{ state: "success", commands, packageVersion: "0.0.0" }}
      />,
    );

    const inventory = screen
      .getByText(/2 published CLI commands/)
      .closest("[data-cli-command-inventory]");
    expect(inventory?.getAttribute("data-inventory-state")).toBe("success");
    expect(inventory?.getAttribute("data-cli-command-count")).toBe("2");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(cliCommandInventoryIdentities(commands)).toEqual([
      "you config init",
      "you",
    ]);
  });

  test("surfaces accessible empty state for empty inventories", () => {
    render(<CliCommandInventory inventory={{ state: "empty" }} />);

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("No CLI commands")).toBeTruthy();
  });

  test("surfaces accessible error state for malformed inventories", () => {
    render(
      <CliCommandInventory
        inventory={{
          state: "error",
          detail: 'Malformed CLI artifact: field "commands" must be an array.',
        }}
      />,
    );

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("CLI inventory error")).toBeTruthy();
    expect(
      screen.getByText(
        'Malformed CLI artifact: field "commands" must be an array.',
      ),
    ).toBeTruthy();
  });
});
