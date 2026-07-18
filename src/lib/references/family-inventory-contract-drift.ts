/**
 * Contract-count drift helpers for W10 CLI, MCP, and JavaScript inventories.
 *
 * Compare rendered inventory identities to identities taken from W03-resolved
 * artifact data (or fixtures shaped like those artifacts). Counts are derived
 * dynamically from the artifact — never hard-coded magic numbers that ignore
 * package growth.
 *
 * Pure transforms only. Callers acquire artifacts through
 * `resolveApiPackageArtifact` (or equivalent fixtures).
 */

export type FamilyInventoryIdentityKind =
  | "command path"
  | "tool name"
  | "symbol path"
  | "shared schema id";

export type FamilyInventoryDriftMatch = {
  ok: true;
  resolvedCount: number;
  renderedCount: number;
};

export type FamilyInventoryDriftMismatch = {
  ok: false;
  resolvedCount: number;
  renderedCount: number;
  missingFromInventory: string[];
  extraInInventory: string[];
  /** Actionable message naming every missing identity. */
  message: string;
};

export type FamilyInventoryDriftResult =
  | FamilyInventoryDriftMatch
  | FamilyInventoryDriftMismatch;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requirePlainObject(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new Error(
      `Malformed family artifact for drift extract: field "${field}" must be an object.`,
    );
  }
  return value;
}

/**
 * Compare resolved artifact identities to rendered inventory identities.
 *
 * Membership is set-based (order-independent). A mismatch always names every
 * missing identity in `message` so maintainers can act on a concrete path/name.
 */
export function compareFamilyInventoryIdentities(
  resolvedIdentities: readonly string[],
  renderedIdentities: readonly string[],
  identityKind: FamilyInventoryIdentityKind,
): FamilyInventoryDriftResult {
  const resolvedSet = new Set(resolvedIdentities);
  const renderedSet = new Set(renderedIdentities);

  const missingFromInventory = [...resolvedSet]
    .filter((identity) => !renderedSet.has(identity))
    .sort();
  const extraInInventory = [...renderedSet]
    .filter((identity) => !resolvedSet.has(identity))
    .sort();

  const resolvedCount = resolvedSet.size;
  const renderedCount = renderedSet.size;

  if (missingFromInventory.length === 0 && extraInInventory.length === 0) {
    return { ok: true, resolvedCount, renderedCount };
  }

  const parts: string[] = [];
  if (missingFromInventory.length > 0) {
    parts.push(
      `Rendered inventory is missing ${identityKind}(s): ${missingFromInventory.join(", ")}`,
    );
  }
  if (extraInInventory.length > 0) {
    parts.push(
      `Rendered inventory has unexpected ${identityKind}(s): ${extraInInventory.join(", ")}`,
    );
  }

  return {
    ok: false,
    resolvedCount,
    renderedCount,
    missingFromInventory,
    extraInInventory,
    message: parts.join(" "),
  };
}

/**
 * Extract published CLI command paths from resolved `@you-agent-factory/api/cli`
 * artifact data (or a fixture shaped like it).
 */
export function extractCliCommandPathsFromArtifact(data: unknown): string[] {
  const root = requirePlainObject(data, "cli");
  const commandsValue = root.commands;
  if (commandsValue === undefined) {
    return [];
  }
  if (!Array.isArray(commandsValue)) {
    throw new Error(
      'Malformed CLI artifact for drift extract: field "commands" must be an array.',
    );
  }

  const paths: string[] = [];
  for (const [index, entry] of commandsValue.entries()) {
    const command = requirePlainObject(entry, `commands[${index}]`);
    const commandPath = optionalNonEmptyString(command.path);
    if (commandPath === undefined) {
      throw new Error(
        `Malformed CLI command at commands[${index}]: path is required for drift identity.`,
      );
    }
    paths.push(commandPath);
  }
  return paths;
}

/**
 * Extract published MCP tool names from resolved `@you-agent-factory/api/mcp`
 * artifact data (or a fixture shaped like it).
 */
export function extractMcpToolNamesFromArtifact(data: unknown): string[] {
  const root = requirePlainObject(data, "mcp");
  const toolsValue = root.tools;
  if (toolsValue === undefined) {
    return [];
  }
  if (!Array.isArray(toolsValue)) {
    throw new Error(
      'Malformed MCP artifact for drift extract: field "tools" must be an array.',
    );
  }

  const names: string[] = [];
  for (const [index, entry] of toolsValue.entries()) {
    const tool = requirePlainObject(entry, `tools[${index}]`);
    const name = optionalNonEmptyString(tool.name);
    if (name === undefined) {
      throw new Error(
        `Malformed MCP tool at tools[${index}]: name is required for drift identity.`,
      );
    }
    names.push(name);
  }
  return names;
}

/**
 * Extract published JavaScript symbol paths from resolved
 * `@you-agent-factory/api/javascript/runtime` artifact data (or a fixture
 * shaped like it). Matches W04 normalize identity (`path` with key fallback).
 */
export function extractJavascriptSymbolPathsFromArtifact(
  data: unknown,
): string[] {
  const root = requirePlainObject(data, "javascript/runtime");
  const symbolsValue = root.symbols;
  if (symbolsValue === undefined) {
    return [];
  }
  const symbolsMap = requirePlainObject(symbolsValue, "symbols");

  const paths: string[] = [];
  for (const [key, entry] of Object.entries(symbolsMap)) {
    const symbol = requirePlainObject(entry, `symbols.${key}`);
    const symbolPath = optionalNonEmptyString(symbol.path) ?? key;
    paths.push(symbolPath);
  }
  return paths;
}

/**
 * Extract published JavaScript shared-schema ids from resolved
 * `@you-agent-factory/api/javascript/runtime` artifact data (or a fixture
 * shaped like it). Matches W04 normalize identity (`id` with key fallback).
 */
export function extractJavascriptSharedSchemaIdsFromArtifact(
  data: unknown,
): string[] {
  const root = requirePlainObject(data, "javascript/runtime");
  const sharedValue = root.sharedSchemas;
  if (sharedValue === undefined) {
    return [];
  }
  const sharedMap = requirePlainObject(sharedValue, "sharedSchemas");

  const ids: string[] = [];
  for (const [key, entry] of Object.entries(sharedMap)) {
    const shared = requirePlainObject(entry, `sharedSchemas.${key}`);
    const id = optionalNonEmptyString(shared.id) ?? key;
    ids.push(id);
  }
  return ids;
}
