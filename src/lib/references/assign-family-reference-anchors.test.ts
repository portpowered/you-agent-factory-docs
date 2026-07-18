import { describe, expect, test } from "bun:test";
import {
  assignCliCommandRegistryAnchors,
  assignJavascriptRuntimeRegistryAnchors,
  assignMcpToolRegistryAnchors,
} from "./assign-family-reference-anchors";
import type {
  CliCommandNormalized,
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
  McpToolNormalized,
} from "./family-normalized-models";
import { createReferenceAnchorRegistry } from "./reference-anchor-registry";
import { REFERENCE_FAMILY_PAGE_PATHS } from "./reference-search-projection";

function cliFixture(
  overrides: Partial<CliCommandNormalized> = {},
): CliCommandNormalized {
  return {
    id: "you.config.init",
    name: "init",
    commandPath: "you config init",
    aliases: [],
    description: "Create operator/system config",
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/cli",
      pointer: "/commands/2",
    },
    anchor: "provisional-wrong",
    ...overrides,
  };
}

function mcpFixture(
  overrides: Partial<McpToolNormalized> = {},
): McpToolNormalized {
  return {
    id: "you.factory_session.get",
    name: "you.factory_session.get",
    description: "Get a session",
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/mcp",
      pointer: "/tools/0",
    },
    anchor: "provisional-wrong",
    ...overrides,
  };
}

function symbolFixture(
  overrides: Partial<JavascriptSymbolNormalized> = {},
): JavascriptSymbolNormalized {
  return {
    id: "javascript.log",
    name: "log",
    symbolPath: "javascript.log",
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/javascript-runtime",
      pointer: "/symbols/0",
    },
    anchor: "provisional-wrong",
    ...overrides,
  };
}

function schemaFixture(
  overrides: Partial<JavascriptSharedSchemaNormalized> = {},
): JavascriptSharedSchemaNormalized {
  return {
    id: "javascript.schema.checkpoint_spec",
    name: "checkpoint_spec",
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/javascript-runtime",
      pointer: "/sharedSchemas/javascript.schema.checkpoint_spec",
    },
    schema: {
      address: {
        publicArtifactId: "@you-agent-factory/api/javascript-runtime",
        pointer: "/sharedSchemas/javascript.schema.checkpoint_spec/schema",
      },
    },
    anchor: "provisional-wrong",
    ...overrides,
  };
}

describe("assignCliCommandRegistryAnchors", () => {
  test("assigns deterministic registry anchors from command paths", () => {
    const first = assignCliCommandRegistryAnchors([cliFixture()]);
    const second = assignCliCommandRegistryAnchors([cliFixture()]);

    expect(first.commands[0]?.anchor).toBe("you-config-init");
    expect(second.commands[0]?.anchor).toBe("you-config-init");
    expect(
      first.registry.getAnchor(
        REFERENCE_FAMILY_PAGE_PATHS.cli,
        "you.config.init",
      ),
    ).toBe("you-config-init");
  });

  test("does not mutate the input command list", () => {
    const original = cliFixture();
    const input = [original];
    const { commands } = assignCliCommandRegistryAnchors(input);

    expect(original.anchor).toBe("provisional-wrong");
    expect(commands[0]?.anchor).toBe("you-config-init");
    expect(commands[0]).not.toBe(original);
  });

  test("reuses an existing registry when provided", () => {
    const registry = createReferenceAnchorRegistry();
    assignCliCommandRegistryAnchors([cliFixture()], { registry });
    expect(registry.listPage(REFERENCE_FAMILY_PAGE_PATHS.cli)).toHaveLength(1);
  });
});

describe("assignMcpToolRegistryAnchors", () => {
  test("assigns deterministic registry anchors from tool names", () => {
    const { tools, registry } = assignMcpToolRegistryAnchors([mcpFixture()]);
    expect(tools[0]?.anchor).toBe("you.factory_session.get");
    expect(
      registry.getAnchor(
        REFERENCE_FAMILY_PAGE_PATHS.mcp,
        "you.factory_session.get",
      ),
    ).toBe("you.factory_session.get");
  });
});

describe("assignJavascriptRuntimeRegistryAnchors", () => {
  test("assigns registry anchors for symbols and shared schemas", () => {
    const { symbols, sharedSchemas, registry } =
      assignJavascriptRuntimeRegistryAnchors(
        [symbolFixture()],
        [schemaFixture()],
      );

    expect(symbols[0]?.anchor).toBe("javascript.log");
    expect(sharedSchemas[0]?.anchor).toBe("javascript.schema.checkpoint_spec");
    expect(
      registry.getAnchor(
        REFERENCE_FAMILY_PAGE_PATHS.javascript,
        "javascript.log",
      ),
    ).toBe("javascript.log");
    expect(
      registry.getAnchor(
        REFERENCE_FAMILY_PAGE_PATHS.javascript,
        "javascript.schema.checkpoint_spec",
      ),
    ).toBe("javascript.schema.checkpoint_spec");
  });

  test("rewrites shared-schema link anchors to registered fragments", () => {
    const { symbols } = assignJavascriptRuntimeRegistryAnchors(
      [
        symbolFixture({
          sharedSchemaLinks: [
            {
              schemaId: "javascript.schema.checkpoint_spec",
              anchor: "stale-link-anchor",
            },
          ],
        }),
      ],
      [schemaFixture()],
    );

    expect(symbols[0]?.sharedSchemaLinks?.[0]?.anchor).toBe(
      "javascript.schema.checkpoint_spec",
    );
  });
});
