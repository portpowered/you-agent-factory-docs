/**
 * Focused proofs for W11 MCP reference inventory loading (W03 → W04 → inventory).
 */
import { describe, expect, test } from "bun:test";
import { loadMcpReferenceInventory } from "./load-mcp-reference-inventory";
import { MCP_REFERENCE_EXPORT_SPECIFIER } from "./mcp-reference-turbopack";

describe("loadMcpReferenceInventory", () => {
  test("resolves the package MCP contract into a success inventory", () => {
    const inventory = loadMcpReferenceInventory();

    expect(inventory.state).toBe("success");
    if (inventory.state !== "success") {
      return;
    }

    expect(inventory.tools.length).toBeGreaterThan(3);
    expect(
      inventory.tools.every(
        (tool) =>
          tool.source.publicArtifactId === MCP_REFERENCE_EXPORT_SPECIFIER,
      ),
    ).toBe(true);

    const control = inventory.tools.find(
      (tool) => tool.name === "you.factory_session.control",
    );
    expect(control?.name).toBe("you.factory_session.control");
    expect(control?.description).toBeTruthy();
    expect(control?.inputSchema).toBeTruthy();
  });

  test("surfaces an error inventory when the public export cannot resolve", () => {
    const inventory = loadMcpReferenceInventory({
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

  test("surfaces an empty inventory when the artifact has no tools", () => {
    const inventory = loadMcpReferenceInventory({
      resolveExport: () => "file:///tmp/mcp-empty.json",
      readTextFile: () =>
        JSON.stringify({
          formatVersion: "mcp-tool-identity/v1",
          tools: [],
        }),
    });

    expect(inventory).toEqual({ state: "empty" });
  });

  test("surfaces an error inventory when the artifact is malformed", () => {
    const inventory = loadMcpReferenceInventory({
      resolveExport: () => "file:///tmp/mcp-malformed.json",
      readTextFile: () =>
        JSON.stringify({
          formatVersion: "mcp-tool-identity/v1",
          tools: "not-an-array",
        }),
    });

    expect(inventory.state).toBe("error");
    if (inventory.state !== "error") {
      return;
    }
    expect(inventory.detail).toMatch(/tools/i);
  });
});
