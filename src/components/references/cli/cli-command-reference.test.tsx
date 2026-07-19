import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CliCommandNormalized } from "@/lib/references/family-normalized-models";
import { CliCapabilityNotice } from "./CliCapabilityNotice";
import { CliCommandInventory } from "./CliCommandInventory";
import {
  CliCommandReference,
  cliCommandInventoryIdentities,
} from "./CliCommandReference";
import {
  CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_DESCRIPTION,
  CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_TITLE,
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
  test("renders trimmed help surface from a normalized CLI projection", () => {
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
    expect(screen.getByText("Long description")).toBeTruthy();
    expect(
      screen.getByText(/Use after install/, { exact: false }),
    ).toBeTruthy();
    expect(screen.getByText("Example")).toBeTruthy();
    expect(
      container.querySelector("[data-cli-example-code]")?.textContent,
    ).toContain("you config init");
    expect(
      container.querySelector("[data-reference-copyable-anchor]"),
    ).toBeTruthy();

    // Verbose metadata chrome removed from the card body.
    expect(container.querySelector("[data-contract-source-badge]")).toBeNull();
    expect(
      container.querySelector("[data-reference-status-chrome]"),
    ).toBeNull();
    expect(screen.queryByText("Aliases")).toBeNull();
    expect(screen.queryByText("bootstrap")).toBeNull();
    expect(screen.queryByText("Command path")).toBeNull();
    expect(screen.queryByText("Leaf name")).toBeNull();
    expect(screen.queryByText("Visibility")).toBeNull();
    expect(screen.queryByText("Runnable")).toBeNull();
    expect(screen.queryByText("Handler present")).toBeNull();
    expect(screen.queryByText("Lifecycle: Active")).toBeNull();
    expect(screen.queryByText("0.0.0")).toBeNull();
    expect(screen.queryByText("Not published on this projection")).toBeNull();
    expect(screen.queryByText("Family")).toBeNull();
    expect(screen.queryByText("Source artifact")).toBeNull();
  });

  test("omits optional help fields when the projection left them absent", () => {
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

    expect(
      screen.getByRole("heading", { name: "you config init" }),
    ).toBeTruthy();
    expect(screen.queryByText("Long description")).toBeNull();
    expect(screen.queryByText("Example")).toBeNull();
    expect(screen.queryByText("Aliases")).toBeNull();
    expect(screen.queryByText("Command path")).toBeNull();
    expect(screen.queryByText("Visibility")).toBeNull();
    expect(screen.queryByText("Runnable")).toBeNull();
    expect(screen.queryByText("Handler present")).toBeNull();
    expect(screen.queryByText("Leaf name")).toBeNull();
    expect(screen.queryByText("Not published on this projection")).toBeNull();
    expect(document.querySelector("[data-contract-source-badge]")).toBeNull();
  });

  test("shows under-construction Flags and arguments when structured options are absent", () => {
    const { container } = render(
      <CliCommandReference command={fixtureCommand()} />,
    );

    expect(
      container.querySelector("[data-cli-capability-notice]"),
    ).toBeTruthy();
    expect(
      container.querySelector(
        '[data-cli-capability="structured-options-under-construction"]',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_TITLE),
    ).toBeTruthy();
    expect(
      screen.getByText(CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_DESCRIPTION),
    ).toBeTruthy();
    expect(screen.getByText("Flags and arguments")).toBeTruthy();
    // Old apology panel is gone.
    expect(
      screen.queryByText("Structured flags and arguments unavailable"),
    ).toBeNull();
    // Visible status chrome — not hover-only.
    expect(screen.getByRole("status")).toBeTruthy();
    // Does not invent option rows.
    expect(screen.queryByText("--help")).toBeNull();
    expect(screen.queryByText("--json")).toBeNull();
    expect(screen.queryByText("Defaults")).toBeNull();
    expect(screen.queryByText("Conflicts")).toBeNull();
  });

  test("hides under-construction notice when structured options exist on the projection", () => {
    const enriched: CliCommandWithStructuredOptions = {
      ...fixtureCommand(),
      flags: [{ name: "--dry-run" }],
    };

    const { container } = render(<CliCommandReference command={enriched} />);

    expect(container.querySelector("[data-cli-capability-notice]")).toBeNull();
    expect(
      screen.queryByText(CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_TITLE),
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
  test("renders accessible under-construction treatment", () => {
    const { container } = render(<CliCapabilityNotice />);

    expect(
      container.querySelector(
        '[data-cli-capability="structured-options-under-construction"]',
      ),
    ).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(
      screen.getByText(CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_TITLE),
    ).toBeTruthy();
    expect(
      screen.getByText(CLI_STRUCTURED_OPTIONS_UNDER_CONSTRUCTION_DESCRIPTION),
    ).toBeTruthy();
    expect(
      screen.queryByText("Structured flags and arguments unavailable"),
    ).toBeNull();
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

    const { container } = render(
      <CliCommandInventory
        inventory={{ state: "success", commands, packageVersion: "0.0.0" }}
      />,
    );

    expect(screen.getByText(/2 published CLI commands/)).toBeTruthy();
    expect(cliCommandInventoryIdentities(commands)).toEqual([
      "you config init",
      "you",
    ]);
    expect(
      screen.getByRole("heading", { name: "you config init" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "you" })).toBeTruthy();
    expect(
      container.querySelectorAll("[data-reference-copyable-anchor]").length,
    ).toBe(2);
    expect(
      container.querySelector("[data-reference-inventory-filter]"),
    ).toBeTruthy();
    expect(
      container
        .querySelector("[data-cli-command-reference]#you-config-init")
        ?.getAttribute("id"),
    ).toBe("you-config-init");
    // Inventory cards stay trimmed — no ContractSourceBadge chrome restored.
    expect(container.querySelector("[data-contract-source-badge]")).toBeNull();
    expect(
      container.querySelectorAll(
        '[data-cli-capability="structured-options-under-construction"]',
      ).length,
    ).toBe(2);
  });

  test("filters the inventory ephemerally without mutating projections", async () => {
    const user = userEvent.setup();
    const commands = [
      fixtureCommand(),
      fixtureCommand({
        id: "you.legacy",
        name: "legacy",
        commandPath: "you legacy",
        aliases: ["old"],
        visibility: "internal",
        lifecycle: { state: "deprecated", deprecated: "0.0.0" },
        anchor: "you-legacy",
        example: undefined,
        longDescription: undefined,
      }),
    ];
    const originalAnchors = commands.map((command) => command.anchor);

    const { container } = render(
      <CliCommandInventory
        inventory={{ state: "success", commands, packageVersion: "0.0.0" }}
      />,
    );

    await user.type(screen.getByLabelText("Command path"), "legacy");
    expect(
      container.getAttribute("data-cli-command-filtered-count") ??
        container
          .querySelector("[data-cli-command-inventory]")
          ?.getAttribute("data-cli-command-filtered-count"),
    ).toBe("1");
    expect(screen.getByRole("heading", { name: "you legacy" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "you config init" }),
    ).toBeNull();
    expect(commands.map((command) => command.anchor)).toEqual(originalAnchors);

    await user.clear(screen.getByLabelText("Command path"));
    await user.selectOptions(screen.getByLabelText("Lifecycle"), "deprecated");
    expect(screen.getByRole("heading", { name: "you legacy" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "you config init" }),
    ).toBeNull();
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
