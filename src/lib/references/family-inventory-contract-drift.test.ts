/**
 * Focused W10 contract-count drift tests.
 *
 * Load CLI, MCP, and JavaScript inventories through the W03 resolve + W04
 * normalize path, then assert renderer inventory identities match the resolved
 * artifact set dynamically. Omitting a resolved identity must fail with an
 * actionable command path, tool name, or symbol path.
 *
 * Does not patch node_modules, does not import package-root or package-internal
 * paths, and does not assert W11 route/nav/search registration inventories.
 */
import { describe, expect, test } from "bun:test";
import { cliCommandInventoryIdentities } from "@/features/references/cli";
import {
  javascriptSharedSchemaInventoryIdentities,
  javascriptSymbolInventoryIdentities,
} from "@/features/references/javascript";
import { mcpToolInventoryIdentities } from "@/features/references/mcp";
import { resolveApiPackageArtifact } from "./api-package-artifact-resolver";
import {
  assignCliCommandRegistryAnchors,
  assignJavascriptRuntimeRegistryAnchors,
  assignMcpToolRegistryAnchors,
} from "./assign-family-reference-anchors";
import {
  compareFamilyInventoryIdentities,
  extractCliCommandPathsFromArtifact,
  extractJavascriptSharedSchemaIdsFromArtifact,
  extractJavascriptSymbolPathsFromArtifact,
  extractMcpToolNamesFromArtifact,
} from "./family-inventory-contract-drift";
import {
  normalizeCliCommandsFromArtifact,
  normalizeJavascriptSharedSchemasFromArtifact,
  normalizeJavascriptSymbolsFromArtifact,
  normalizeMcpToolsFromArtifact,
} from "./normalize-family-artifacts";

describe("compareFamilyInventoryIdentities", () => {
  test("matches equal identity sets regardless of order", () => {
    const result = compareFamilyInventoryIdentities(
      ["you", "you config init"],
      ["you config init", "you"],
      "command path",
    );
    expect(result).toEqual({
      ok: true,
      resolvedCount: 2,
      renderedCount: 2,
    });
  });

  test("reports missing identities with an actionable message", () => {
    const result = compareFamilyInventoryIdentities(
      ["you", "you config init", "you mcp"],
      ["you", "you mcp"],
      "command path",
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected mismatch");
    }
    expect(result.missingFromInventory).toEqual(["you config init"]);
    expect(result.extraInInventory).toEqual([]);
    expect(result.message).toContain("you config init");
    expect(result.message).toContain("command path");
  });

  test("reports unexpected extra identities", () => {
    const result = compareFamilyInventoryIdentities(
      ["you.factory_session.get"],
      ["you.factory_session.get", "invented.tool"],
      "tool name",
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected mismatch");
    }
    expect(result.extraInInventory).toEqual(["invented.tool"]);
    expect(result.message).toContain("invented.tool");
  });
});

describe("artifact identity extractors", () => {
  test("extract CLI command paths from fixture-shaped artifact data", () => {
    const paths = extractCliCommandPathsFromArtifact({
      formatVersion: "cli-command-identity/v1",
      commands: [
        { path: "you", name: "you", idCandidate: "you" },
        {
          path: "you config init",
          name: "init",
          idCandidate: "you.config.init",
        },
      ],
    });
    expect(paths).toEqual(["you", "you config init"]);
  });

  test("extract MCP tool names from fixture-shaped artifact data", () => {
    const names = extractMcpToolNamesFromArtifact({
      tools: [
        { name: "you.factory_session.get", idCandidate: "factory-session.get" },
        {
          name: "you.factory_session.control",
          idCandidate: "factory-session.control",
        },
      ],
    });
    expect(names).toEqual([
      "you.factory_session.get",
      "you.factory_session.control",
    ]);
  });

  test("extract JavaScript symbol paths with path-or-key identity", () => {
    const paths = extractJavascriptSymbolPathsFromArtifact({
      symbols: {
        "javascript.args": {
          id: "javascript.args",
          name: "args",
          path: "args",
        },
        "javascript.meta": { id: "javascript.meta", name: "meta" },
      },
    });
    expect(paths).toEqual(["args", "javascript.meta"]);
  });

  test("extract JavaScript shared schema ids with id-or-key identity", () => {
    const ids = extractJavascriptSharedSchemaIdsFromArtifact({
      sharedSchemas: {
        "schemas.SessionId": { id: "schemas.SessionId" },
        "schemas.WorkItem": {},
      },
    });
    expect(ids).toEqual(["schemas.SessionId", "schemas.WorkItem"]);
  });
});

describe("W10 CLI contract-count drift (W03/W04)", () => {
  test("rendered CLI inventory identities match the resolved artifact set dynamically", () => {
    const artifact = resolveApiPackageArtifact("cli");
    const resolved = extractCliCommandPathsFromArtifact(artifact.data);
    const commands = normalizeCliCommandsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });
    const anchored = assignCliCommandRegistryAnchors(commands).commands;
    const rendered = cliCommandInventoryIdentities(anchored);

    // Dynamic completeness — never assert a hard-coded magic count.
    expect(resolved.length).toBeGreaterThan(0);
    expect(rendered.length).toBe(resolved.length);

    const drift = compareFamilyInventoryIdentities(
      resolved,
      rendered,
      "command path",
    );
    expect(drift).toEqual({
      ok: true,
      resolvedCount: resolved.length,
      renderedCount: rendered.length,
    });
  });

  test("omitting a resolved CLI command fails with an actionable command path", () => {
    const artifact = resolveApiPackageArtifact("cli");
    const resolved = extractCliCommandPathsFromArtifact(artifact.data);
    const commands = normalizeCliCommandsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });
    const anchored = assignCliCommandRegistryAnchors(commands).commands;
    expect(anchored.length).toBeGreaterThan(1);

    const omitted = anchored[0];
    if (omitted === undefined) {
      throw new Error("expected at least one CLI command");
    }
    const incomplete = anchored.slice(1);
    const drift = compareFamilyInventoryIdentities(
      resolved,
      cliCommandInventoryIdentities(incomplete),
      "command path",
    );

    expect(drift.ok).toBe(false);
    if (drift.ok) {
      throw new Error("expected CLI drift mismatch");
    }
    expect(drift.missingFromInventory).toContain(omitted.commandPath);
    expect(drift.message).toContain(omitted.commandPath);
    expect(drift.message).toContain("command path");
  });
});

describe("W10 MCP contract-count drift (W03/W04)", () => {
  test("rendered MCP inventory identities match the resolved artifact set dynamically", () => {
    const artifact = resolveApiPackageArtifact("mcp");
    const resolved = extractMcpToolNamesFromArtifact(artifact.data);
    const tools = normalizeMcpToolsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });
    const anchored = assignMcpToolRegistryAnchors(tools).tools;
    const rendered = mcpToolInventoryIdentities(anchored);

    expect(resolved.length).toBeGreaterThan(0);
    expect(rendered.length).toBe(resolved.length);

    const drift = compareFamilyInventoryIdentities(
      resolved,
      rendered,
      "tool name",
    );
    expect(drift).toEqual({
      ok: true,
      resolvedCount: resolved.length,
      renderedCount: rendered.length,
    });
  });

  test("omitting a resolved MCP tool fails with an actionable tool name", () => {
    const artifact = resolveApiPackageArtifact("mcp");
    const resolved = extractMcpToolNamesFromArtifact(artifact.data);
    const tools = normalizeMcpToolsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });
    const anchored = assignMcpToolRegistryAnchors(tools).tools;
    expect(anchored.length).toBeGreaterThan(1);

    const omitted = anchored[0];
    if (omitted === undefined) {
      throw new Error("expected at least one MCP tool");
    }
    const incomplete = anchored.slice(1);
    const drift = compareFamilyInventoryIdentities(
      resolved,
      mcpToolInventoryIdentities(incomplete),
      "tool name",
    );

    expect(drift.ok).toBe(false);
    if (drift.ok) {
      throw new Error("expected MCP drift mismatch");
    }
    expect(drift.missingFromInventory).toContain(omitted.name);
    expect(drift.message).toContain(omitted.name);
    expect(drift.message).toContain("tool name");
  });
});

describe("W10 JavaScript contract-count drift (W03/W04)", () => {
  test("rendered JavaScript symbol and shared-schema identities match the resolved artifact set dynamically", () => {
    const artifact = resolveApiPackageArtifact("javascript/runtime");
    const resolvedSymbols = extractJavascriptSymbolPathsFromArtifact(
      artifact.data,
    );
    const resolvedSchemas = extractJavascriptSharedSchemaIdsFromArtifact(
      artifact.data,
    );
    const symbols = normalizeJavascriptSymbolsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });
    const sharedSchemas = normalizeJavascriptSharedSchemasFromArtifact(
      artifact.data,
      { publicArtifactId: artifact.specifier },
    );
    const anchored = assignJavascriptRuntimeRegistryAnchors(
      symbols,
      sharedSchemas,
    );
    const renderedSymbols = javascriptSymbolInventoryIdentities(
      anchored.symbols,
    );
    const renderedSchemas = javascriptSharedSchemaInventoryIdentities(
      anchored.sharedSchemas,
    );

    expect(resolvedSymbols.length).toBeGreaterThan(0);
    expect(resolvedSchemas.length).toBeGreaterThan(0);
    expect(renderedSymbols.length).toBe(resolvedSymbols.length);
    expect(renderedSchemas.length).toBe(resolvedSchemas.length);

    const symbolDrift = compareFamilyInventoryIdentities(
      resolvedSymbols,
      renderedSymbols,
      "symbol path",
    );
    expect(symbolDrift).toEqual({
      ok: true,
      resolvedCount: resolvedSymbols.length,
      renderedCount: renderedSymbols.length,
    });

    const schemaDrift = compareFamilyInventoryIdentities(
      resolvedSchemas,
      renderedSchemas,
      "shared schema id",
    );
    expect(schemaDrift).toEqual({
      ok: true,
      resolvedCount: resolvedSchemas.length,
      renderedCount: renderedSchemas.length,
    });
  });

  test("omitting a resolved JavaScript symbol fails with an actionable symbol path", () => {
    const artifact = resolveApiPackageArtifact("javascript/runtime");
    const resolvedSymbols = extractJavascriptSymbolPathsFromArtifact(
      artifact.data,
    );
    const symbols = normalizeJavascriptSymbolsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });
    const sharedSchemas = normalizeJavascriptSharedSchemasFromArtifact(
      artifact.data,
      { publicArtifactId: artifact.specifier },
    );
    const anchored = assignJavascriptRuntimeRegistryAnchors(
      symbols,
      sharedSchemas,
    );
    expect(anchored.symbols.length).toBeGreaterThan(1);

    const omitted = anchored.symbols[0];
    if (omitted === undefined) {
      throw new Error("expected at least one JavaScript symbol");
    }
    const incomplete = anchored.symbols.slice(1);
    const drift = compareFamilyInventoryIdentities(
      resolvedSymbols,
      javascriptSymbolInventoryIdentities(incomplete),
      "symbol path",
    );

    expect(drift.ok).toBe(false);
    if (drift.ok) {
      throw new Error("expected JavaScript symbol drift mismatch");
    }
    expect(drift.missingFromInventory).toContain(omitted.symbolPath);
    expect(drift.message).toContain(omitted.symbolPath);
    expect(drift.message).toContain("symbol path");
  });
});
