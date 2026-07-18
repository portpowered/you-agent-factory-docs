import { describe, expect, test } from "bun:test";
import {
  createCliCommandNormalized,
  createJavascriptSharedSchemaNormalized,
  createJavascriptSymbolNormalized,
  createMcpToolNormalized,
} from "@/lib/references/family-normalized-models";
import { REFERENCE_FAMILY_PAGE_PATHS } from "@/lib/references/reference-search-projection";
import {
  buildCliCommandSearchDocuments,
  buildJavascriptRuntimeSearchDocuments,
  buildMcpToolSearchDocuments,
  CLI_COMMAND_SEARCH_DOCUMENT_TAGS,
  JAVASCRIPT_RUNTIME_SEARCH_DOCUMENT_TAGS,
  loadCliCommandReferenceSearchShapes,
  loadJavascriptRuntimeReferenceSearchShapes,
  loadMcpToolReferenceSearchShapes,
  MCP_TOOL_SEARCH_DOCUMENT_TAGS,
} from "./build-cli-mcp-javascript-reference-search-documents";
import { REFERENCE_SEARCH_DOCUMENT_KIND } from "./factory-search-kinds";

describe("buildCliCommandSearchDocuments", () => {
  test("projects fixture commands into CLI deep-link search shapes", () => {
    const commands = [
      createCliCommandNormalized({
        id: "you.config.init",
        name: "init",
        commandPath: "you config init",
        aliases: ["config-init"],
        description: "Initialize factory config.",
        source: {
          publicArtifactId: "@you-agent-factory/api/cli",
          pointer: "/commands/you.config.init",
        },
        anchor: "you-config-init",
      }),
    ];

    const result = buildCliCommandSearchDocuments(commands);
    expect(result.documents).toHaveLength(1);
    const document = result.documents[0];
    expect(document?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
    expect(document?.family).toBe("cli");
    expect(document?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.cli}#you-config-init`,
    );
    expect(document?.anchor).toBe("you-config-init");
    expect(document?.aliases).toContain("you config init");
    expect(document?.tags).toContain("cli");
    expect(document?.tags).toContain(CLI_COMMAND_SEARCH_DOCUMENT_TAGS.command);
  });

  test("loads packaged CLI commands with registry anchors", () => {
    const result = loadCliCommandReferenceSearchShapes();
    expect(result.documents.length).toBeGreaterThan(0);
    expect(result.documents.length).toBe(result.commands.length);

    const init = result.documents.find(
      (document) => document.title === "you config init",
    );
    expect(init).toBeDefined();
    expect(init?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.cli}#${init?.anchor}`,
    );
    expect(init?.anchor).toBe("you-config-init");
    expect(init?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);

    for (const document of result.documents) {
      expect(
        document.url.startsWith(`${REFERENCE_FAMILY_PAGE_PATHS.cli}#`),
      ).toBe(true);
    }
  });
});

describe("buildMcpToolSearchDocuments", () => {
  test("projects fixture tools into MCP deep-link search shapes", () => {
    const tools = [
      createMcpToolNormalized({
        id: "factory-session.get",
        name: "you.factory_session.get",
        description: "Get a factory session.",
        source: {
          publicArtifactId: "@you-agent-factory/api/mcp",
          pointer: "/tools/you.factory_session.get",
        },
        anchor: "you.factory_session.get",
      }),
    ];

    const result = buildMcpToolSearchDocuments(tools);
    expect(result.documents).toHaveLength(1);
    const document = result.documents[0];
    expect(document?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
    expect(document?.family).toBe("mcp");
    expect(document?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.mcp}#you.factory_session.get`,
    );
    expect(document?.tags).toContain(MCP_TOOL_SEARCH_DOCUMENT_TAGS.tool);
  });

  test("loads packaged MCP tools with registry anchors", () => {
    const result = loadMcpToolReferenceSearchShapes();
    expect(result.documents.length).toBeGreaterThan(0);
    expect(result.documents.length).toBe(result.tools.length);

    const get = result.documents.find(
      (document) => document.anchor === "you.factory_session.get",
    );
    expect(get).toBeDefined();
    expect(get?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.mcp}#you.factory_session.get`,
    );
    expect(get?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);

    for (const document of result.documents) {
      expect(
        document.url.startsWith(`${REFERENCE_FAMILY_PAGE_PATHS.mcp}#`),
      ).toBe(true);
    }
  });
});

describe("buildJavascriptRuntimeSearchDocuments", () => {
  test("projects symbols and shared schemas into JS deep-link search shapes", () => {
    const symbols = [
      createJavascriptSymbolNormalized({
        id: "javascript.log",
        name: "log",
        symbolPath: "log",
        description: "Write a log line.",
        source: {
          publicArtifactId: "@you-agent-factory/api/javascript/runtime",
          pointer: "/symbols/javascript.log",
        },
        anchor: "javascript.log",
      }),
    ];
    const sharedSchemas = [
      createJavascriptSharedSchemaNormalized({
        id: "javascript.schema.json_compatible",
        name: "json_compatible",
        title: "JSON compatible",
        source: {
          publicArtifactId: "@you-agent-factory/api/javascript/runtime",
          pointer: "/sharedSchemas/javascript.schema.json_compatible",
        },
        anchor: "javascript.schema.json_compatible",
      }),
    ];

    const result = buildJavascriptRuntimeSearchDocuments(
      symbols,
      sharedSchemas,
    );
    expect(result.documents).toHaveLength(2);

    const log = result.documents.find(
      (document) => document.anchor === "javascript.log",
    );
    expect(log?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
    expect(log?.family).toBe("javascript");
    expect(log?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.javascript}#javascript.log`,
    );
    expect(log?.tags).toContain(JAVASCRIPT_RUNTIME_SEARCH_DOCUMENT_TAGS.symbol);

    const schema = result.documents.find(
      (document) => document.anchor === "javascript.schema.json_compatible",
    );
    expect(schema?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.javascript}#javascript.schema.json_compatible`,
    );
    expect(schema?.tags).toContain(
      JAVASCRIPT_RUNTIME_SEARCH_DOCUMENT_TAGS.sharedSchema,
    );
  });

  test("loads packaged JavaScript runtime items with registry anchors", () => {
    const result = loadJavascriptRuntimeReferenceSearchShapes();
    expect(result.documents.length).toBeGreaterThan(0);
    expect(result.documents.length).toBe(
      result.symbols.length + result.sharedSchemas.length,
    );

    const log = result.documents.find(
      (document) => document.anchor === "javascript.log",
    );
    expect(log).toBeDefined();
    expect(log?.url).toBe(
      `${REFERENCE_FAMILY_PAGE_PATHS.javascript}#javascript.log`,
    );
    expect(log?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);

    for (const document of result.documents) {
      expect(
        document.url.startsWith(`${REFERENCE_FAMILY_PAGE_PATHS.javascript}#`),
      ).toBe(true);
    }
  });
});
