import { describe, expect, test } from "bun:test";
import { cliCommandGroupAnchor, groupCliCommands } from "./cli-command-groups";
import type { CliCommandNormalized } from "./family-normalized-models";
import { loadCliReferenceInventory } from "./load-cli-reference-inventory";
import { dedentCliExample } from "./normalize-family-artifacts";

function command(commandPath: string): CliCommandNormalized {
  return {
    id: commandPath.replace(/\s+/g, "."),
    name: commandPath.split(" ").at(-1) ?? commandPath,
    commandPath,
    aliases: [],
    anchor: commandPath.replace(/\s+/g, "-"),
    source: {
      publicArtifactId: "@you-agent-factory/api/cli",
      pointer: `/commands/${commandPath}`,
    },
  };
}

function groupPaths(commands: readonly CliCommandNormalized[]): string[] {
  return groupCliCommands(commands).map((group) => group.path);
}

describe("groupCliCommands", () => {
  test("gives a two-segment family its own group once two commands share it", () => {
    expect(
      groupPaths([
        command("you"),
        command("you factory"),
        command("you factory list"),
      ]),
    ).toEqual(["you", "you factory"]);
  });

  test("keeps a one-off subcommand in the root group instead of a group of one", () => {
    const groups = groupCliCommands([command("you"), command("you run")]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.path).toBe("you");
    expect(groups[0]?.commands.map((entry) => entry.commandPath)).toEqual([
      "you",
      "you run",
    ]);
  });

  test("leads each group with the family command, then reads alphabetically", () => {
    const groups = groupCliCommands([
      command("you work show"),
      command("you work"),
      command("you work list"),
    ]);

    expect(groups[0]?.commands.map((entry) => entry.commandPath)).toEqual([
      "you work",
      "you work list",
      "you work show",
    ]);
  });

  test("orders the root group first, then families alphabetically", () => {
    expect(
      groupPaths([
        command("you work"),
        command("you work list"),
        command("you factory"),
        command("you factory list"),
        command("you"),
      ]),
    ).toEqual(["you", "you factory", "you work"]);
  });

  test("namespaces group anchors so they cannot collide with command anchors", () => {
    expect(cliCommandGroupAnchor("you factory")).toBe("commands-you-factory");
    expect(cliCommandGroupAnchor("you")).toBe("commands-you");
  });

  test("covers every published command exactly once", () => {
    const inventory = loadCliReferenceInventory();
    expect(inventory.state).toBe("success");
    if (inventory.state !== "success") {
      return;
    }

    const grouped = groupCliCommands(inventory.commands).flatMap(
      (group) => group.commands,
    );

    expect(grouped).toHaveLength(inventory.commands.length);
    expect(new Set(grouped.map((entry) => entry.id)).size).toBe(
      inventory.commands.length,
    );
  });
});

describe("dedentCliExample", () => {
  test("removes the indentation every line shares", () => {
    expect(dedentCliExample("  # comment\n  you run\n\n  you run --json")).toBe(
      "# comment\nyou run\n\nyou run --json",
    );
  });

  test("keeps relative indentation inside the block", () => {
    expect(dedentCliExample("  you run\n    --named @you/goal")).toBe(
      "you run\n  --named @you/goal",
    );
  });

  test("leaves an already-flush block alone", () => {
    expect(dedentCliExample("you run\n  --json")).toBe("you run\n  --json");
  });

  test("treats blank and non-string input as unpublished", () => {
    expect(dedentCliExample("   \n  ")).toBeUndefined();
    expect(dedentCliExample(undefined)).toBeUndefined();
    expect(dedentCliExample(42)).toBeUndefined();
  });

  test("every published example lands flush against the left edge", () => {
    const inventory = loadCliReferenceInventory();
    expect(inventory.state).toBe("success");
    if (inventory.state !== "success") {
      return;
    }

    const hanging = inventory.commands
      .filter((command) => command.example !== undefined)
      .filter((command) => {
        const lines = (command.example ?? "")
          .split("\n")
          .filter((line) => line.trim().length > 0);
        return lines.every((line) => line.startsWith(" "));
      })
      .map((command) => command.commandPath);

    expect(hanging).toEqual([]);
  });
});
