/**
 * Assign stable ReferenceAnchorRegistry anchors onto W04-normalized CLI, MCP,
 * and JavaScript projections.
 *
 * Pure — never mutates inputs, never touches filesystem or package resolution.
 * Callers pass already-normalized items; returned copies carry registry
 * fragments deterministic for the same (kind, identity) across rebuilds.
 */

import type {
  CliCommandNormalized,
  JavascriptSharedSchemaNormalized,
  JavascriptSymbolNormalized,
  McpToolNormalized,
} from "./family-normalized-models";
import {
  createReferenceAnchorRegistry,
  type ReferenceAnchorRegistry,
} from "./reference-anchor-registry";
import { REFERENCE_FAMILY_PAGE_PATHS } from "./reference-search-projection";

export type AssignFamilyAnchorsOptions = {
  /**
   * Owning page id for collision-checked registration. Defaults to the W04
   * family page path (for example `/docs/references/cli`).
   */
  owningPageId?: string;
  /** Reuse an existing registry; otherwise a fresh one is created. */
  registry?: ReferenceAnchorRegistry;
};

export type AssignCliCommandAnchorsResult = {
  commands: CliCommandNormalized[];
  registry: ReferenceAnchorRegistry;
};

export type AssignMcpToolAnchorsResult = {
  tools: McpToolNormalized[];
  registry: ReferenceAnchorRegistry;
};

export type AssignJavascriptRuntimeAnchorsResult = {
  symbols: JavascriptSymbolNormalized[];
  sharedSchemas: JavascriptSharedSchemaNormalized[];
  registry: ReferenceAnchorRegistry;
};

function resolveRegistry(
  options: AssignFamilyAnchorsOptions | undefined,
): ReferenceAnchorRegistry {
  return options?.registry ?? createReferenceAnchorRegistry();
}

/**
 * Register each CLI command and return shallow copies with registry anchors.
 * Identity seed is the published `commandPath`.
 */
export function assignCliCommandRegistryAnchors(
  commands: readonly CliCommandNormalized[],
  options: AssignFamilyAnchorsOptions = {},
): AssignCliCommandAnchorsResult {
  const registry = resolveRegistry(options);
  const owningPageId = options.owningPageId ?? REFERENCE_FAMILY_PAGE_PATHS.cli;

  const assigned: CliCommandNormalized[] = commands.map((command) => {
    const anchor = registry.register({
      owningPageId,
      itemId: command.id,
      kind: "command",
      identity: command.commandPath,
    });
    if (anchor === command.anchor) {
      return command;
    }
    return { ...command, anchor };
  });

  return { commands: assigned, registry };
}

/**
 * Register each MCP tool and return shallow copies with registry anchors.
 * Identity seed is the published tool `name`.
 */
export function assignMcpToolRegistryAnchors(
  tools: readonly McpToolNormalized[],
  options: AssignFamilyAnchorsOptions = {},
): AssignMcpToolAnchorsResult {
  const registry = resolveRegistry(options);
  const owningPageId = options.owningPageId ?? REFERENCE_FAMILY_PAGE_PATHS.mcp;

  const assigned: McpToolNormalized[] = tools.map((tool) => {
    const anchor = registry.register({
      owningPageId,
      itemId: tool.id,
      kind: "tool",
      identity: tool.name,
    });
    if (anchor === tool.anchor) {
      return tool;
    }
    return { ...tool, anchor };
  });

  return { tools: assigned, registry };
}

/**
 * Register JavaScript symbols and shared schemas; return shallow copies with
 * registry anchors. Symbol identity is the published symbol `id`; shared
 * schema identity is the published schema `id` registered as a schema-pointer.
 * Shared-schema link anchors on symbols are rewritten to match the registered
 * fragments.
 */
export function assignJavascriptRuntimeRegistryAnchors(
  symbols: readonly JavascriptSymbolNormalized[],
  sharedSchemas: readonly JavascriptSharedSchemaNormalized[],
  options: AssignFamilyAnchorsOptions = {},
): AssignJavascriptRuntimeAnchorsResult {
  const registry = resolveRegistry(options);
  const owningPageId =
    options.owningPageId ?? REFERENCE_FAMILY_PAGE_PATHS.javascript;

  const schemaAnchorById = new Map<string, string>();
  const assignedSchemas: JavascriptSharedSchemaNormalized[] = sharedSchemas.map(
    (schema) => {
      const anchor = registry.register({
        owningPageId,
        itemId: schema.id,
        kind: "schema-pointer",
        identity: schema.id,
      });
      schemaAnchorById.set(schema.id, anchor);
      if (anchor === schema.anchor) {
        return schema;
      }
      return { ...schema, anchor };
    },
  );

  const assignedSymbols: JavascriptSymbolNormalized[] = symbols.map(
    (symbol) => {
      const anchor = registry.register({
        owningPageId,
        itemId: symbol.id,
        kind: "symbol",
        identity: symbol.id,
      });

      let sharedSchemaLinks = symbol.sharedSchemaLinks;
      let linksChanged = false;
      if (sharedSchemaLinks !== undefined) {
        const nextLinks = sharedSchemaLinks.map((link) => {
          const registered = schemaAnchorById.get(link.schemaId);
          if (registered === undefined || registered === link.anchor) {
            return link;
          }
          linksChanged = true;
          return { ...link, anchor: registered };
        });
        if (linksChanged) {
          sharedSchemaLinks = nextLinks;
        }
      }

      if (anchor === symbol.anchor && !linksChanged) {
        return symbol;
      }

      const next: JavascriptSymbolNormalized = { ...symbol, anchor };
      if (sharedSchemaLinks !== undefined) {
        next.sharedSchemaLinks = sharedSchemaLinks;
      }
      return next;
    },
  );

  return {
    symbols: assignedSymbols,
    sharedSchemas: assignedSchemas,
    registry,
  };
}
