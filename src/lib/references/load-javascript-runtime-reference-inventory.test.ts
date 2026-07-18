/**
 * Focused proofs for W11 JavaScript runtime reference inventory loading
 * (W03 → W04 → inventory).
 */
import { describe, expect, test } from "bun:test";
import { JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER } from "./javascript-runtime-reference-turbopack";
import { loadJavascriptRuntimeReferenceInventory } from "./load-javascript-runtime-reference-inventory";

describe("loadJavascriptRuntimeReferenceInventory", () => {
  test("resolves the package JavaScript runtime contract into a success inventory", () => {
    const inventory = loadJavascriptRuntimeReferenceInventory();

    expect(inventory.state).toBe("success");
    if (inventory.state !== "success") {
      return;
    }

    expect(inventory.symbols.length).toBeGreaterThan(3);
    expect(inventory.sharedSchemas.length).toBeGreaterThan(0);
    expect(
      inventory.symbols.every(
        (symbol) =>
          symbol.source.publicArtifactId ===
          JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER,
      ),
    ).toBe(true);
    expect(
      inventory.sharedSchemas.every(
        (schema) =>
          schema.source.publicArtifactId ===
          JAVASCRIPT_RUNTIME_REFERENCE_EXPORT_SPECIFIER,
      ),
    ).toBe(true);

    const args = inventory.symbols.find(
      (symbol) => symbol.id === "javascript.args",
    );
    expect(args?.id).toBe("javascript.args");
    expect(args?.name).toBeTruthy();
    expect(args?.symbolPath).toBeTruthy();
  });

  test("surfaces an error inventory when the public export cannot resolve", () => {
    const inventory = loadJavascriptRuntimeReferenceInventory({
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

  test("surfaces an empty inventory when the artifact has no symbols or shared schemas", () => {
    const inventory = loadJavascriptRuntimeReferenceInventory({
      resolveExport: () => "file:///tmp/javascript-runtime-empty.json",
      readTextFile: () =>
        JSON.stringify({
          formatVersion: "javascript-runtime-api/v1",
          symbols: {},
          sharedSchemas: {},
        }),
    });

    expect(inventory).toEqual({ state: "empty" });
  });

  test("surfaces an error inventory when the artifact is malformed", () => {
    const inventory = loadJavascriptRuntimeReferenceInventory({
      resolveExport: () => "file:///tmp/javascript-runtime-malformed.json",
      readTextFile: () =>
        JSON.stringify({
          formatVersion: "javascript-runtime-api/v1",
          symbols: "not-an-object",
        }),
    });

    expect(inventory.state).toBe("error");
    if (inventory.state !== "error") {
      return;
    }
    expect(inventory.detail).toMatch(/symbols/i);
  });
});
