/**
 * Build Orama-ready reference search shapes for published CLI commands, MCP
 * tools, and JavaScript runtime symbols / shared schemas (W16 story 004).
 *
 * Loads each family via W03 turbopack-safe public-subpath resolution, normalizes
 * with W04 helpers, assigns shared ReferenceAnchorRegistry anchors, and projects
 * item-level documents deep-linking to `/docs/references/cli|mcp|javascript-runtime#…`.
 * Does not invent competing IDs or import renderer/component barrels.
 */

import { resolveApiPackageArtifact } from "@/lib/references/api-package-artifact-resolver";
import {
  assignCliCommandRegistryAnchors,
  assignJavascriptRuntimeRegistryAnchors,
  assignMcpToolRegistryAnchors,
} from "@/lib/references/assign-family-reference-anchors";
import {
  CLI_REFERENCE_PUBLIC_SUBPATH,
  cliReferenceTurbopackLoadDependencies,
} from "@/lib/references/cli-reference-turbopack";
import type {
  CliCommandNormalized,
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
  McpToolNormalized,
} from "@/lib/references/family-normalized-models";
import {
  JAVASCRIPT_RUNTIME_REFERENCE_PUBLIC_SUBPATH,
  javascriptRuntimeReferenceTurbopackLoadDependencies,
} from "@/lib/references/javascript-runtime-reference-turbopack";
import {
  MCP_REFERENCE_PUBLIC_SUBPATH,
  mcpReferenceTurbopackLoadDependencies,
} from "@/lib/references/mcp-reference-turbopack";
import {
  normalizeCliCommandsFromArtifact,
  normalizeJavascriptSharedSchemasFromArtifact,
  normalizeJavascriptSymbolsFromArtifact,
  normalizeMcpToolsFromArtifact,
} from "@/lib/references/normalize-family-artifacts";
import {
  createReferenceAnchorRegistry,
  type ReferenceAnchorRegistry,
  type RegisteredReferenceAnchor,
} from "@/lib/references/reference-anchor-registry";
import {
  createReferenceItem,
  type ReferenceItem,
} from "@/lib/references/reference-item";
import {
  createReferenceSearchDocumentBuilder,
  REFERENCE_FAMILY_PAGE_PATHS,
  type ReferenceSearchDocumentShape,
} from "@/lib/references/reference-search-projection";

export const CLI_COMMAND_SEARCH_DOCUMENT_TAGS = {
  command: "cli-command",
} as const;

export const MCP_TOOL_SEARCH_DOCUMENT_TAGS = {
  tool: "mcp-tool",
} as const;

export const JAVASCRIPT_RUNTIME_SEARCH_DOCUMENT_TAGS = {
  symbol: "javascript-symbol",
  sharedSchema: "javascript-shared-schema",
} as const;

export type BuildCliCommandSearchDocumentsOptions = {
  pagePath?: string;
  owningPageId?: string;
  registry?: ReferenceAnchorRegistry;
};

export type CliCommandSearchDocumentsResult = {
  commands: CliCommandNormalized[];
  items: ReferenceItem[];
  documents: ReferenceSearchDocumentShape[];
  registry: ReferenceAnchorRegistry;
  registered: RegisteredReferenceAnchor[];
};

export type BuildMcpToolSearchDocumentsOptions = {
  pagePath?: string;
  owningPageId?: string;
  registry?: ReferenceAnchorRegistry;
};

export type McpToolSearchDocumentsResult = {
  tools: McpToolNormalized[];
  items: ReferenceItem[];
  documents: ReferenceSearchDocumentShape[];
  registry: ReferenceAnchorRegistry;
  registered: RegisteredReferenceAnchor[];
};

export type BuildJavascriptRuntimeSearchDocumentsOptions = {
  pagePath?: string;
  owningPageId?: string;
  registry?: ReferenceAnchorRegistry;
};

export type JavascriptRuntimeSearchDocumentsResult = {
  symbols: JavascriptSymbolNormalized[];
  sharedSchemas: JavascriptSharedSchemaNormalized[];
  items: ReferenceItem[];
  documents: ReferenceSearchDocumentShape[];
  registry: ReferenceAnchorRegistry;
  registered: RegisteredReferenceAnchor[];
};

function unique(values: readonly (string | undefined)[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (value === undefined) {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0 || out.includes(trimmed)) {
      continue;
    }
    out.push(trimmed);
  }
  return out;
}

function registeredForPage(
  registry: ReferenceAnchorRegistry,
  owningPageId: string,
  itemIds: readonly string[],
): RegisteredReferenceAnchor[] {
  const registered: RegisteredReferenceAnchor[] = [];
  for (const itemId of itemIds) {
    const entry = registry.get(owningPageId, itemId);
    if (entry) {
      registered.push(entry);
    }
  }
  return registered;
}

/**
 * Project normalized CLI commands into ReferenceItems with registry anchors on
 * `/docs/references/cli`.
 */
export function buildCliCommandSearchDocuments(
  commands: readonly CliCommandNormalized[],
  options: BuildCliCommandSearchDocumentsOptions = {},
): CliCommandSearchDocumentsResult {
  const pagePath = options.pagePath ?? REFERENCE_FAMILY_PAGE_PATHS.cli;
  const owningPageId = options.owningPageId ?? pagePath;
  const { commands: assigned, registry } = assignCliCommandRegistryAnchors(
    commands,
    {
      owningPageId,
      registry: options.registry ?? createReferenceAnchorRegistry(),
    },
  );

  const items: ReferenceItem[] = assigned.map((command) => {
    const aliases = unique([
      command.commandPath,
      command.name,
      command.id,
      ...command.aliases,
      command.anchor,
    ]);
    const itemInput: Parameters<typeof createReferenceItem>[0] = {
      id: command.id,
      family: "cli",
      title: command.commandPath,
      lifecycle: command.lifecycle ?? { state: "active" },
      source: command.source,
      aliases,
      anchor: command.anchor,
    };
    if (command.description !== undefined) {
      itemInput.description = command.description;
    }
    return createReferenceItem(itemInput);
  });

  const builder = createReferenceSearchDocumentBuilder({
    pagePathByFamily: { cli: pagePath },
  });
  const documents = builder.buildMany(items, {
    pagePath,
    tags: [CLI_COMMAND_SEARCH_DOCUMENT_TAGS.command],
    extraBodyText: "CLI command",
  });

  return {
    commands: assigned,
    items,
    documents,
    registry,
    registered: registeredForPage(
      registry,
      owningPageId,
      assigned.map((command) => command.id),
    ),
  };
}

/**
 * Project normalized MCP tools into ReferenceItems with registry anchors on
 * `/docs/references/mcp-reference`.
 */
export function buildMcpToolSearchDocuments(
  tools: readonly McpToolNormalized[],
  options: BuildMcpToolSearchDocumentsOptions = {},
): McpToolSearchDocumentsResult {
  const pagePath = options.pagePath ?? REFERENCE_FAMILY_PAGE_PATHS.mcp;
  const owningPageId = options.owningPageId ?? pagePath;
  const { tools: assigned, registry } = assignMcpToolRegistryAnchors(tools, {
    owningPageId,
    registry: options.registry ?? createReferenceAnchorRegistry(),
  });

  const items: ReferenceItem[] = assigned.map((tool) => {
    const aliases = unique([tool.name, tool.id, tool.anchor]);
    const itemInput: Parameters<typeof createReferenceItem>[0] = {
      id: tool.id,
      family: "mcp",
      title: tool.name,
      lifecycle: tool.lifecycle ?? { state: "active" },
      source: tool.source,
      aliases,
      anchor: tool.anchor,
    };
    if (tool.description !== undefined) {
      itemInput.description = tool.description;
    }
    return createReferenceItem(itemInput);
  });

  const builder = createReferenceSearchDocumentBuilder({
    pagePathByFamily: { mcp: pagePath },
  });
  const documents = builder.buildMany(items, {
    pagePath,
    tags: [MCP_TOOL_SEARCH_DOCUMENT_TAGS.tool],
    extraBodyText: "MCP tool",
  });

  return {
    tools: assigned,
    items,
    documents,
    registry,
    registered: registeredForPage(
      registry,
      owningPageId,
      assigned.map((tool) => tool.id),
    ),
  };
}

/**
 * Project normalized JavaScript symbols and shared schemas into ReferenceItems
 * with registry anchors on `/docs/references/javascript-runtime`.
 */
export function buildJavascriptRuntimeSearchDocuments(
  symbols: readonly JavascriptSymbolNormalized[],
  sharedSchemas: readonly JavascriptSharedSchemaNormalized[],
  options: BuildJavascriptRuntimeSearchDocumentsOptions = {},
): JavascriptRuntimeSearchDocumentsResult {
  const pagePath = options.pagePath ?? REFERENCE_FAMILY_PAGE_PATHS.javascript;
  const owningPageId = options.owningPageId ?? pagePath;
  const {
    symbols: assignedSymbols,
    sharedSchemas: assignedSchemas,
    registry,
  } = assignJavascriptRuntimeRegistryAnchors(symbols, sharedSchemas, {
    owningPageId,
    registry: options.registry ?? createReferenceAnchorRegistry(),
  });

  const symbolItems: ReferenceItem[] = assignedSymbols.map((symbol) => {
    const aliases = unique([
      symbol.id,
      symbol.name,
      symbol.symbolPath,
      symbol.anchor,
    ]);
    const itemInput: Parameters<typeof createReferenceItem>[0] = {
      id: symbol.id,
      family: "javascript",
      title: symbol.id,
      lifecycle: symbol.lifecycle ?? { state: "active" },
      source: symbol.source,
      aliases,
      anchor: symbol.anchor,
    };
    if (symbol.description !== undefined) {
      itemInput.description = symbol.description;
    }
    return createReferenceItem(itemInput);
  });

  const schemaItems: ReferenceItem[] = assignedSchemas.map((schema) => {
    const aliases = unique([
      schema.id,
      schema.name,
      schema.title,
      schema.anchor,
    ]);
    const itemInput: Parameters<typeof createReferenceItem>[0] = {
      id: schema.id,
      family: "javascript",
      title: schema.title ?? schema.name,
      lifecycle: schema.lifecycle ?? { state: "active" },
      source: schema.source,
      aliases,
      anchor: schema.anchor,
    };
    if (schema.description !== undefined) {
      itemInput.description = schema.description;
    }
    return createReferenceItem(itemInput);
  });

  const builder = createReferenceSearchDocumentBuilder({
    pagePathByFamily: { javascript: pagePath },
  });
  const symbolDocuments = builder.buildMany(symbolItems, {
    pagePath,
    tags: [JAVASCRIPT_RUNTIME_SEARCH_DOCUMENT_TAGS.symbol],
    extraBodyText: "JavaScript runtime symbol",
  });
  const schemaDocuments = builder.buildMany(schemaItems, {
    pagePath,
    tags: [JAVASCRIPT_RUNTIME_SEARCH_DOCUMENT_TAGS.sharedSchema],
    extraBodyText: "JavaScript shared schema",
  });

  const items = [...symbolItems, ...schemaItems];
  const documents = [...symbolDocuments, ...schemaDocuments];

  return {
    symbols: assignedSymbols,
    sharedSchemas: assignedSchemas,
    items,
    documents,
    registry,
    registered: registeredForPage(
      registry,
      owningPageId,
      items.map((item) => item.id),
    ),
  };
}

/**
 * Load packaged CLI commands and project them into search shapes with registry
 * anchors on `/docs/references/cli`.
 */
export function loadCliCommandReferenceSearchShapes(): CliCommandSearchDocumentsResult {
  const artifact = resolveApiPackageArtifact(CLI_REFERENCE_PUBLIC_SUBPATH, {
    ...cliReferenceTurbopackLoadDependencies(),
  });
  const commands = normalizeCliCommandsFromArtifact(artifact.data, {
    publicArtifactId: artifact.specifier,
    sourcePath: artifact.resolvedPath,
  });
  return buildCliCommandSearchDocuments(commands);
}

/**
 * Load packaged MCP tools and project them into search shapes with registry
 * anchors on `/docs/references/mcp-reference`.
 */
export function loadMcpToolReferenceSearchShapes(): McpToolSearchDocumentsResult {
  const artifact = resolveApiPackageArtifact(MCP_REFERENCE_PUBLIC_SUBPATH, {
    ...mcpReferenceTurbopackLoadDependencies(),
  });
  const tools = normalizeMcpToolsFromArtifact(artifact.data, {
    publicArtifactId: artifact.specifier,
    sourcePath: artifact.resolvedPath,
  });
  return buildMcpToolSearchDocuments(tools);
}

/**
 * Load packaged JavaScript runtime symbols / shared schemas and project them
 * into search shapes with registry anchors on `/docs/references/javascript-runtime`.
 */
export function loadJavascriptRuntimeReferenceSearchShapes(): JavascriptRuntimeSearchDocumentsResult {
  const artifact = resolveApiPackageArtifact(
    JAVASCRIPT_RUNTIME_REFERENCE_PUBLIC_SUBPATH,
    {
      ...javascriptRuntimeReferenceTurbopackLoadDependencies(),
    },
  );
  const normalizeOptions = {
    publicArtifactId: artifact.specifier,
    sourcePath: artifact.resolvedPath,
  };
  const symbols = normalizeJavascriptSymbolsFromArtifact(
    artifact.data,
    normalizeOptions,
  );
  const sharedSchemas = normalizeJavascriptSharedSchemasFromArtifact(
    artifact.data,
    normalizeOptions,
  );
  return buildJavascriptRuntimeSearchDocuments(symbols, sharedSchemas);
}
