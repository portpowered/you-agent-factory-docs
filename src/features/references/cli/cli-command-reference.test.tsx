import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  CliCommandNormalized,
  CliFlagNormalized,
} from "@/lib/references/family-normalized-models";
import { CliCommandInventory } from "./CliCommandInventory";
import {
  cliFlagInvocation,
  cliInheritedFlags,
  cliLocalFlags,
} from "./CliCommandOptions";
import {
  CliCommandReference,
  cliCommandInventoryIdentities,
} from "./CliCommandReference";
import { splitCliCommandDescription } from "./cli-command-description";
import {
  cliVisibilityDisplayLabel,
  mapCliVisibilityToReferenceVisibility,
} from "./cli-visibility";

afterEach(() => {
  cleanup();
});

function fixtureFlag(
  overrides: Partial<CliFlagNormalized> = {},
): CliFlagNormalized {
  return {
    id: "you.config.init.flag.force",
    long: "force",
    shorthand: "f",
    valueType: "bool",
    usage: "overwrite an existing config",
    required: false,
    repeatable: false,
    scope: "local",
    ...overrides,
  };
}

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

describe("splitCliCommandDescription", () => {
  test("drops a long description that only restates the short one", () => {
    expect(
      splitCliCommandDescription({
        shortDescription: "List persisted named factories",
        longDescription:
          "List persisted named factories.\n\nReads one factory root at a time.",
      }),
    ).toEqual({
      summary: "List persisted named factories",
      detail: "Reads one factory root at a time.",
    });
  });

  test("keeps both when the long description opens with different prose", () => {
    expect(
      splitCliCommandDescription({
        shortDescription: "Configuration command guide",
        longDescription:
          "Route configuration tasks to their canonical commands.",
      }),
    ).toEqual({
      summary: "Configuration command guide",
      detail: "Route configuration tasks to their canonical commands.",
    });
  });

  test("emits no detail when the long description adds nothing", () => {
    expect(
      splitCliCommandDescription({
        shortDescription: "Run a factory",
        longDescription: "Run a factory.",
      }),
    ).toEqual({ summary: "Run a factory" });
  });

  test("promotes the long description when no short one is published", () => {
    expect(
      splitCliCommandDescription({
        longDescription: "Serve the dashboard.\n\nStays up until cancelled.",
      }),
    ).toEqual({
      summary: "Serve the dashboard.",
      detail: "Stays up until cancelled.",
    });
  });
});

describe("cli flag partitioning", () => {
  test("splits a command's own flags from the inherited global ones", () => {
    const flags = [
      fixtureFlag(),
      fixtureFlag({ id: "f.json", long: "json", scope: "inherited" }),
      fixtureFlag({ id: "f.root", long: "verbose", scope: "persistent" }),
    ];

    expect(cliLocalFlags(flags).map((flag) => flag.long)).toEqual([
      "force",
      "verbose",
    ]);
    expect(cliInheritedFlags(flags).map((flag) => flag.long)).toEqual(["json"]);
    expect(cliLocalFlags(undefined)).toEqual([]);
    expect(cliInheritedFlags(undefined)).toEqual([]);
  });

  test("renders a flag the way it is typed", () => {
    expect(cliFlagInvocation(fixtureFlag())).toBe("--force, -f");
    expect(cliFlagInvocation(fixtureFlag({ shorthand: undefined }))).toBe(
      "--force",
    );
  });
});

describe("CliCommandReference", () => {
  test("renders the published help surface without repeating the description", () => {
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
      screen.getAllByText("Create operator/system config on a fresh home"),
    ).toHaveLength(1);
    // The restated opening line is dropped; only the added prose remains.
    expect(screen.getByText("Use after install.")).toBeTruthy();
    expect(screen.queryByText("Long description")).toBeNull();
    expect(screen.getByText("Example")).toBeTruthy();
    expect(
      container.querySelector("[data-cli-example-code]")?.textContent,
    ).toContain("you config init");
    expect(
      container.querySelector("[data-reference-copyable-anchor]"),
    ).toBeTruthy();

    // Verbose metadata chrome stays out of the card body.
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
  });

  test("omits optional help fields when the projection left them absent", () => {
    const { container } = render(
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
    expect(screen.queryByText("Example")).toBeNull();
    expect(container.querySelector("[data-cli-flags]")).toBeNull();
    expect(container.querySelector("[data-cli-arguments]")).toBeNull();
    expect(container.querySelector("[data-cli-inherited-flags]")).toBeNull();
    expect(document.querySelector("[data-contract-source-badge]")).toBeNull();
  });

  test("renders published flags and arguments instead of an apology", () => {
    const { container } = render(
      <CliCommandReference
        command={fixtureCommand({
          flags: [
            fixtureFlag(),
            fixtureFlag({
              id: "f.output",
              long: "output",
              shorthand: undefined,
              valueType: "string",
              defaultValue: "primary",
              usage: "select the stdout projection",
            }),
            fixtureFlag({
              id: "f.json",
              long: "json",
              shorthand: undefined,
              scope: "inherited",
              usage: "emit structured JSON",
            }),
          ],
          arguments: [
            {
              id: "you.config.init.arg.0",
              name: "path",
              position: 0,
              valueType: "string",
              required: true,
              variadic: false,
              channels: ["cli", "stdin"],
            },
          ],
        })}
        rootAnchor="you"
      />,
    );

    const flagsTable = container.querySelector("[data-cli-flags]");
    expect(flagsTable).toBeTruthy();
    expect(within(flagsTable as HTMLElement).getByText("Flags")).toBeTruthy();
    expect(container.querySelector('[data-cli-flag="force"]')).toBeTruthy();
    expect(screen.getByText("--force, -f")).toBeTruthy();
    expect(screen.getByText("overwrite an existing config")).toBeTruthy();
    expect(screen.getByText("select the stdout projection")).toBeTruthy();
    expect(screen.getByText("primary")).toBeTruthy();

    // Inherited globals are pointed at, not repeated as rows on every command.
    expect(container.querySelector('[data-cli-flag="json"]')).toBeNull();
    const inherited = container.querySelector("[data-cli-inherited-flags]");
    expect(inherited?.textContent).toContain("--json");
    expect(inherited?.querySelector('a[href="#you"]')).toBeTruthy();

    const argumentsTable = container.querySelector("[data-cli-arguments]");
    expect(argumentsTable).toBeTruthy();
    expect(container.querySelector('[data-cli-argument="path"]')).toBeTruthy();
    expect(screen.getByText("<path>")).toBeTruthy();
    expect(screen.getByText(/Required/)).toBeTruthy();
    expect(screen.getByText(/Reads from cli, stdin/)).toBeTruthy();

    // The retired under-construction apology is gone for good.
    expect(container.querySelector("[data-cli-capability-notice]")).toBeNull();
    expect(screen.queryByText("🚧 Under construction")).toBeNull();
    expect(
      screen.queryByText(
        "Structured flags and arguments are not published yet.",
      ),
    ).toBeNull();
  });

  test("omits a boolean default of false rather than printing it on every switch", () => {
    const { container } = render(
      <CliCommandReference
        command={fixtureCommand({
          flags: [fixtureFlag({ defaultValue: "false" })],
        })}
      />,
    );

    expect(container.querySelector("[data-cli-flags]")).toBeTruthy();
    expect(screen.queryByText("Default")).toBeNull();
  });
});

describe("CliCommandInventory", () => {
  test("groups commands under family headings", () => {
    const commands = [
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
      fixtureCommand({
        id: "you.factory",
        name: "factory",
        commandPath: "you factory",
        aliases: [],
        anchor: "you-factory",
      }),
      fixtureCommand({
        id: "you.factory.list",
        name: "list",
        commandPath: "you factory list",
        aliases: [],
        anchor: "you-factory-list",
      }),
    ];

    const { container } = render(
      <CliCommandInventory
        inventory={{ state: "success", commands, packageVersion: "0.0.0" }}
      />,
    );

    expect(screen.getByText(/3 published CLI commands/)).toBeTruthy();
    expect(cliCommandInventoryIdentities(commands)).toEqual([
      "you",
      "you factory",
      "you factory list",
    ]);

    const groups = container.querySelectorAll("[data-cli-command-group]");
    expect(
      [...groups].map((group) => group.getAttribute("data-cli-command-group")),
    ).toEqual(["you", "you factory"]);
    expect(document.getElementById("commands-you-factory")).toBeTruthy();

    expect(
      screen.getByRole("heading", { level: 2, name: "you factory" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: "you factory list" }),
    ).toBeTruthy();
    expect(
      container.querySelectorAll("[data-reference-copyable-anchor]").length,
    ).toBe(3);
    expect(
      container.querySelector("[data-reference-inventory-filter]"),
    ).toBeTruthy();
    expect(container.querySelector("[data-contract-source-badge]")).toBeNull();
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
      container
        .querySelector("[data-cli-command-inventory]")
        ?.getAttribute("data-cli-command-filtered-count") ??
        container.getAttribute("data-cli-command-filtered-count"),
    ).toBe("1");
    expect(
      screen.getByRole("heading", { level: 3, name: "you legacy" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { level: 3, name: "you config init" }),
    ).toBeNull();
    expect(commands.map((command) => command.anchor)).toEqual(originalAnchors);

    await user.clear(screen.getByLabelText("Command path"));
    await user.selectOptions(screen.getByLabelText("Lifecycle"), "deprecated");
    expect(
      screen.getByRole("heading", { level: 3, name: "you legacy" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { level: 3, name: "you config init" }),
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
