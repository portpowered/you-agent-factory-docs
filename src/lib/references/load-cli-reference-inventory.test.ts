/**
 * Focused proofs for W11 CLI reference inventory loading (W03 → W04 → inventory).
 */
import { describe, expect, test } from "bun:test";
import { CLI_REFERENCE_EXPORT_SPECIFIER } from "./cli-reference-turbopack";
import { loadCliReferenceInventory } from "./load-cli-reference-inventory";

describe("loadCliReferenceInventory", () => {
  test("resolves the package CLI contract into a success inventory", () => {
    const inventory = loadCliReferenceInventory();

    expect(inventory.state).toBe("success");
    if (inventory.state !== "success") {
      return;
    }

    expect(inventory.commands.length).toBeGreaterThan(5);
    expect(
      inventory.commands.every(
        (command) =>
          command.source.publicArtifactId === CLI_REFERENCE_EXPORT_SPECIFIER,
      ),
    ).toBe(true);

    const init = inventory.commands.find(
      (command) => command.id === "you.config.init",
    );
    expect(init?.commandPath).toBe("you config init");
    expect(init?.description).toBeTruthy();
  });

  test("surfaces an error inventory when the public export cannot resolve", () => {
    const inventory = loadCliReferenceInventory({
      resolveExport: () => {
        throw new Error("forced missing export");
      },
    });

    expect(inventory.state).toBe("error");
    if (inventory.state !== "error") {
      return;
    }
    expect(inventory.detail).toMatch(/missing|resolve|export/i);
  });

  test("surfaces an empty inventory when the artifact has no commands", () => {
    const inventory = loadCliReferenceInventory({
      resolveExport: () => "file:///tmp/cli-empty.json",
      readTextFile: () =>
        JSON.stringify({
          formatVersion: "cli-command-identity/v1",
          commands: [],
        }),
    });

    expect(inventory).toEqual({ state: "empty" });
  });

  test("surfaces an error inventory when the artifact is malformed", () => {
    const inventory = loadCliReferenceInventory({
      resolveExport: () => "file:///tmp/cli-malformed.json",
      readTextFile: () =>
        JSON.stringify({
          formatVersion: "cli-command-identity/v1",
          commands: "not-an-array",
        }),
    });

    expect(inventory.state).toBe("error");
    if (inventory.state !== "error") {
      return;
    }
    expect(inventory.detail).toMatch(/commands/i);
  });
});
