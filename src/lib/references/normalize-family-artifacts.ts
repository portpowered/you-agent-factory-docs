/**
 * Normalize W03-resolved public-subpath artifact data (or fixtures shaped like
 * it) into family-specific serializable models.
 *
 * Pure transforms only — callers must acquire artifacts through
 * `resolveApiPackageArtifact` (or equivalent fixtures). Never import package
 * root or package-internal paths from this module.
 */

import { toApiPackageExportSpecifier } from "./api-package-public-exports";
import {
  type CliArgumentNormalized,
  type CliCommandNormalized,
  type CliFlagNormalized,
  type CliFlagScope,
  createCliCommandNormalized,
  createEventTypeNormalized,
  createJavascriptSharedSchemaNormalized,
  createJavascriptSymbolNormalized,
  createMcpToolNormalized,
  createOpenApiOperationSummary,
  type EventTypeNormalized,
  encodeJsonPointerSegment,
  FamilyNormalizedModelParseError,
  isOpenApiHttpMethod,
  type JavascriptSharedSchemaLink,
  type JavascriptSharedSchemaNormalized,
  type JavascriptSymbolNormalized,
  type McpToolNormalized,
  type OpenApiHttpMethod,
  type OpenApiOperationSummary,
  provisionalAnchorFromIdentity,
} from "./family-normalized-models";
import {
  McpInputSchemaProjectionError,
  projectMcpInputSchemaToDefinition,
  requiredInputsFromDefinition,
} from "./mcp-input-schema-projection";
import {
  isReferenceLifecycleState,
  type ReferenceLifecycle,
  type ReferenceSourcePointer,
} from "./reference-item";

export type FamilyArtifactNormalizeErrorCode =
  | "malformed-artifact"
  | "unsupported-lifecycle-state";

export class FamilyArtifactNormalizeError extends Error {
  readonly code: FamilyArtifactNormalizeErrorCode;
  readonly field?: string;

  constructor(
    code: FamilyArtifactNormalizeErrorCode,
    message: string,
    options: { field?: string; cause?: unknown } = {},
  ) {
    super(
      message,
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = "FamilyArtifactNormalizeError";
    this.code = code;
    this.field = options.field;
  }
}

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
    throw new FamilyArtifactNormalizeError(
      "malformed-artifact",
      `Malformed family artifact: field "${field}" must be an object.`,
      { field },
    );
  }
  return value;
}

function sourcePointer(
  publicArtifactId: string,
  pointer: string,
  path?: string,
): ReferenceSourcePointer {
  const source: ReferenceSourcePointer = { publicArtifactId, pointer };
  if (path !== undefined) {
    source.path = path;
  }
  return source;
}

function lifecycleFromStringOrObject(
  value: unknown,
  field: string,
): ReferenceLifecycle | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const state = optionalNonEmptyString(value);
    if (state === undefined) {
      return undefined;
    }
    if (!isReferenceLifecycleState(state)) {
      throw new FamilyArtifactNormalizeError(
        "unsupported-lifecycle-state",
        `Malformed family artifact: field "${field}" has unsupported lifecycle state "${state}".`,
        { field },
      );
    }
    return { state };
  }

  if (!isPlainObject(value)) {
    throw new FamilyArtifactNormalizeError(
      "malformed-artifact",
      `Malformed family artifact: field "${field}" must be a lifecycle string or object.`,
      { field },
    );
  }

  const state = optionalNonEmptyString(value.state);
  if (state === undefined) {
    return undefined;
  }
  if (!isReferenceLifecycleState(state)) {
    throw new FamilyArtifactNormalizeError(
      "unsupported-lifecycle-state",
      `Malformed family artifact: field "${field}.state" has unsupported lifecycle state "${state}".`,
      { field: `${field}.state` },
    );
  }

  const lifecycle: ReferenceLifecycle = { state };
  const since = optionalNonEmptyString(value.since);
  if (since !== undefined) {
    lifecycle.since = since;
  }
  const deprecated = optionalNonEmptyString(value.deprecated);
  if (deprecated !== undefined) {
    lifecycle.deprecated = deprecated;
  }
  const removed = optionalNonEmptyString(value.removed);
  if (removed !== undefined) {
    lifecycle.removed = removed;
  }
  const successorId = optionalNonEmptyString(value.successorId);
  if (successorId !== undefined) {
    lifecycle.successorId = successorId;
  }
  return lifecycle;
}

function openApiPointerForOperation(
  pathTemplate: string,
  method: OpenApiHttpMethod,
): string {
  return `/paths/${encodeJsonPointerSegment(pathTemplate)}/${method}`;
}

/**
 * Normalize OpenAPI document data into operation summaries.
 * Expects the structured object from `@you-agent-factory/api/openapi`.
 */
export function normalizeOpenApiOperationsFromArtifact(
  data: unknown,
  options: {
    publicArtifactId?: string;
    sourcePath?: string;
  } = {},
): OpenApiOperationSummary[] {
  const root = requirePlainObject(data, "openapi");
  const pathsValue = root.paths;
  if (pathsValue === undefined) {
    return [];
  }
  const paths = requirePlainObject(pathsValue, "paths");
  const publicArtifactId =
    options.publicArtifactId ?? toApiPackageExportSpecifier("openapi");

  const operations: OpenApiOperationSummary[] = [];

  for (const [pathTemplate, pathItemValue] of Object.entries(paths)) {
    if (!isPlainObject(pathItemValue)) {
      continue;
    }

    for (const [methodKey, operationValue] of Object.entries(pathItemValue)) {
      const method = methodKey.toLowerCase();
      if (!isOpenApiHttpMethod(method) || !isPlainObject(operationValue)) {
        continue;
      }

      const operationId = optionalNonEmptyString(operationValue.operationId);
      const id = operationId ?? `openapi.operation.${method}:${pathTemplate}`;
      const summary = optionalNonEmptyString(operationValue.summary);
      const description = optionalNonEmptyString(operationValue.description);

      let tags: string[] | undefined;
      if (operationValue.tags !== undefined) {
        if (!Array.isArray(operationValue.tags)) {
          throw new FamilyArtifactNormalizeError(
            "malformed-artifact",
            `Malformed OpenAPI operation at ${method.toUpperCase()} ${pathTemplate}: "tags" must be an array of strings.`,
            { field: "tags" },
          );
        }
        const parsedTags = operationValue.tags
          .map((tag) => optionalNonEmptyString(tag))
          .filter((tag): tag is string => tag !== undefined);
        if (parsedTags.length > 0) {
          tags = parsedTags;
        }
      }

      const anchorSeed = operationId ?? `${method}-${pathTemplate}`;
      const model: OpenApiOperationSummary = {
        id,
        method,
        path: pathTemplate,
        source: sourcePointer(
          publicArtifactId,
          openApiPointerForOperation(pathTemplate, method),
          options.sourcePath,
        ),
        anchor: provisionalAnchorFromIdentity(anchorSeed),
      };

      if (operationId !== undefined) {
        model.operationId = operationId;
      }
      if (summary !== undefined) {
        model.summary = summary;
      }
      if (description !== undefined) {
        model.description = description;
      }
      if (tags !== undefined) {
        model.tags = tags;
      }

      try {
        operations.push(createOpenApiOperationSummary(model));
      } catch (cause) {
        throw wrapModelError(
          `Malformed OpenAPI operation at ${method.toUpperCase()} ${pathTemplate}`,
          cause,
        );
      }
    }
  }

  return operations;
}

/**
 * Read the canonical-English string out of a `cli-command-identity` prose node.
 *
 * The published shape is `{ canonicalEnglish, id }` — the `id` is the message
 * key upstream localization will key off. Docs render the canonical English and
 * ignore the key, so a node with no usable prose reads as absent.
 */
function canonicalEnglishProse(value: unknown): string | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }
  return optionalNonEmptyString(value.canonicalEnglish);
}

/**
 * Project the nested `documentation` block onto the flat title / description /
 * example fields the CLI reference renders.
 *
 * `@you-agent-factory/api` 0.0.6 moved this prose out of the flat `short` /
 * `long` / `example` command fields and into a nested documentation block with
 * message ids, and turned `example` (one string) into `examples` (a list).
 */
function cliCommandProseFromDocumentation(value: unknown): {
  shortDescription?: string;
  longDescription?: string;
  example?: string;
} {
  if (!isPlainObject(value)) {
    return {};
  }

  const prose = isPlainObject(value.documentation) ? value.documentation : {};
  const shortDescription = canonicalEnglishProse(prose.title);
  const longDescription = canonicalEnglishProse(prose.description);

  // Examples are authored one invocation per entry. Joining with newlines keeps
  // the existing single-string `example` contract without dropping any of them.
  const examples: string[] = [];
  if (Array.isArray(value.examples)) {
    for (const entry of value.examples) {
      const normalized = optionalNonEmptyString(entry);
      if (normalized !== undefined) {
        examples.push(normalized);
      }
    }
  }

  const projected: {
    shortDescription?: string;
    longDescription?: string;
    example?: string;
  } = {};
  if (shortDescription !== undefined) {
    projected.shortDescription = shortDescription;
  }
  if (longDescription !== undefined) {
    projected.longDescription = longDescription;
  }
  if (examples.length > 0) {
    projected.example = examples.join("\n");
  }
  return projected;
}

/**
 * Render a published flag default as a display string.
 *
 * 0.0.6 publishes two shapes: a flat `default` string on subcommand flags and a
 * single-key `defaultValue` wrapper (`{ "boolean": false }`) on root flags.
 * Both are copied verbatim — a missing or empty default stays absent.
 */
function cliFlagDefaultDisplay(
  flag: Record<string, unknown>,
): string | undefined {
  const flat = optionalNonEmptyString(flag.default);
  if (flat !== undefined) {
    return flat;
  }
  if (!isPlainObject(flag.defaultValue)) {
    return undefined;
  }
  for (const wrapped of Object.values(flag.defaultValue)) {
    if (typeof wrapped === "string") {
      const trimmed = wrapped.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
      continue;
    }
    if (typeof wrapped === "boolean" || typeof wrapped === "number") {
      return String(wrapped);
    }
  }
  return undefined;
}

function cliContractStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const entries: string[] = [];
  for (const entry of value) {
    const normalized = optionalNonEmptyString(entry);
    if (normalized !== undefined) {
      entries.push(normalized);
    }
  }
  return entries;
}

/**
 * Index published flag help text by flag id across every command.
 *
 * Descendant commands re-list ancestor flags with `scope: "inherited"` and no
 * `usage`, pointing at the declaring flag through `inheritedFromInputId`. The
 * index lets the projector borrow the declared text instead of rendering an
 * inherited flag with an empty description.
 */
function cliFlagUsageIndex(
  commands: Record<string, unknown>,
): Map<string, string> {
  const usageById = new Map<string, string>();
  for (const command of Object.values(commands)) {
    if (!isPlainObject(command) || !isPlainObject(command.flags)) {
      continue;
    }
    for (const flag of Object.values(command.flags)) {
      if (!isPlainObject(flag)) {
        continue;
      }
      const id = optionalNonEmptyString(flag.id);
      const usage = optionalNonEmptyString(flag.usage);
      if (id !== undefined && usage !== undefined && !usageById.has(id)) {
        usageById.set(id, usage);
      }
    }
  }
  return usageById;
}

/**
 * Project one command's published flags. Hidden flags are dropped; everything
 * else is copied from the contract. Unknown scopes fall back to `local` so a
 * future scope value still renders instead of failing the whole page.
 */
function cliFlagsFromCommand(
  command: Record<string, unknown>,
  usageById: Map<string, string>,
): CliFlagNormalized[] {
  if (!isPlainObject(command.flags)) {
    return [];
  }

  const flags: CliFlagNormalized[] = [];
  for (const entry of Object.values(command.flags)) {
    if (!isPlainObject(entry)) {
      continue;
    }
    if (optionalNonEmptyString(entry.visibility) === "hidden") {
      continue;
    }
    const id = optionalNonEmptyString(entry.id);
    const long = optionalNonEmptyString(entry.long);
    if (id === undefined || long === undefined) {
      continue;
    }

    const rawScope = optionalNonEmptyString(entry.scope);
    const scope: CliFlagScope =
      rawScope === "inherited" || rawScope === "persistent"
        ? rawScope
        : "local";

    const flag: CliFlagNormalized = {
      id,
      long,
      required: entry.required === true,
      repeatable: entry.repeatable === true,
      scope,
    };

    const shorthand = optionalNonEmptyString(entry.shorthand);
    if (shorthand !== undefined) {
      flag.shorthand = shorthand;
    }
    const valueType = optionalNonEmptyString(entry.valueType);
    if (valueType !== undefined) {
      flag.valueType = valueType;
    }
    const usage =
      optionalNonEmptyString(entry.usage) ??
      usageById.get(optionalNonEmptyString(entry.inheritedFromInputId) ?? "") ??
      usageById.get(id);
    if (usage !== undefined) {
      flag.usage = usage;
    }
    const defaultValue = cliFlagDefaultDisplay(entry);
    if (defaultValue !== undefined) {
      flag.defaultValue = defaultValue;
    }
    const enumValues = cliContractStringList(entry.enum);
    if (enumValues.length > 0) {
      flag.enumValues = enumValues;
    }
    const lifecycle = lifecycleFromStringOrObject(
      entry.lifecycle,
      `flags.${id}.lifecycle`,
    );
    if (lifecycle !== undefined) {
      flag.lifecycle = lifecycle;
    }

    flags.push(flag);
  }

  flags.sort((left, right) => left.long.localeCompare(right.long));
  return flags;
}

/** Project one command's published positional arguments in position order. */
function cliArgumentsFromCommand(
  command: Record<string, unknown>,
): CliArgumentNormalized[] {
  if (!isPlainObject(command.arguments)) {
    return [];
  }

  const args: CliArgumentNormalized[] = [];
  for (const entry of Object.values(command.arguments)) {
    if (!isPlainObject(entry)) {
      continue;
    }
    if (optionalNonEmptyString(entry.visibility) === "hidden") {
      continue;
    }
    const id = optionalNonEmptyString(entry.id);
    const name = optionalNonEmptyString(entry.name);
    if (id === undefined || name === undefined) {
      continue;
    }

    const argument: CliArgumentNormalized = {
      id,
      name,
      position: typeof entry.position === "number" ? entry.position : 0,
      required: entry.required === true,
      variadic: entry.variadic === true,
    };

    const valueType = optionalNonEmptyString(entry.valueType);
    if (valueType !== undefined) {
      argument.valueType = valueType;
    }
    const enumValues = cliContractStringList(entry.enum);
    if (enumValues.length > 0) {
      argument.enumValues = enumValues;
    }
    const channels = cliContractStringList(entry.channels);
    if (channels.length > 0) {
      argument.channels = channels;
    }

    args.push(argument);
  }

  args.sort((left, right) => left.position - right.position);
  return args;
}

/**
 * Normalize CLI command inventory data into command models.
 * Expects the structured object from `@you-agent-factory/api/cli`.
 *
 * `commands` is keyed by dotted command id (`you.factory.list`); each entry
 * still carries the space-separated invocation as `path`. Before 0.0.6 this was
 * an array of entries with a flat `idCandidate` / `short` / `long` shape — the
 * artifact `formatVersion` gate in `api-package-format-versions.ts` is what
 * stops an older package from reaching this projector.
 */
export function normalizeCliCommandsFromArtifact(
  data: unknown,
  options: {
    publicArtifactId?: string;
    sourcePath?: string;
  } = {},
): CliCommandNormalized[] {
  const root = requirePlainObject(data, "cli");
  const commandsValue = root.commands;
  if (commandsValue === undefined) {
    return [];
  }
  if (!isPlainObject(commandsValue)) {
    throw new FamilyArtifactNormalizeError(
      "malformed-artifact",
      `Malformed CLI artifact: field "commands" must be an object keyed by command id.`,
      { field: "commands" },
    );
  }

  const publicArtifactId =
    options.publicArtifactId ?? toApiPackageExportSpecifier("cli");
  const commands: CliCommandNormalized[] = [];
  const flagUsageById = cliFlagUsageIndex(commandsValue);

  for (const [key, entry] of Object.entries(commandsValue)) {
    const field = `commands.${key}`;
    const command = requirePlainObject(entry, field);
    // The map key is the identity; `id` restates it. Prefer the body so a
    // rekeyed artifact fails the identity check instead of silently renaming.
    const id =
      optionalNonEmptyString(command.id) ?? optionalNonEmptyString(key);
    const name = optionalNonEmptyString(command.name);
    const commandPath = optionalNonEmptyString(command.path);
    if (id === undefined || name === undefined || commandPath === undefined) {
      throw new FamilyArtifactNormalizeError(
        "malformed-artifact",
        `Malformed CLI command at ${field}: id, name, and path are required.`,
        { field },
      );
    }

    const aliasesRaw = command.aliases;
    const aliases: string[] = [];
    if (aliasesRaw !== undefined) {
      if (!Array.isArray(aliasesRaw)) {
        throw new FamilyArtifactNormalizeError(
          "malformed-artifact",
          `Malformed CLI command at ${field}: aliases must be an array.`,
          { field: `${field}.aliases` },
        );
      }
      for (const alias of aliasesRaw) {
        const normalized = optionalNonEmptyString(alias);
        if (normalized !== undefined) {
          aliases.push(normalized);
        }
      }
    }

    const { shortDescription, longDescription, example } =
      cliCommandProseFromDocumentation(command.documentation);
    // Prefer short help text; fall back to long. Empty package strings stay absent.
    const description = shortDescription ?? longDescription;
    const visibility = optionalNonEmptyString(command.visibility);

    const lifecycle = lifecycleFromStringOrObject(
      command.lifecycle,
      `${field}.lifecycle`,
    );

    const model: CliCommandNormalized = {
      id,
      name,
      commandPath,
      aliases,
      source: sourcePointer(
        publicArtifactId,
        `/commands/${encodeJsonPointerSegment(key)}`,
        options.sourcePath,
      ),
      anchor: provisionalAnchorFromIdentity(commandPath),
    };

    if (description !== undefined) {
      model.description = description;
    }
    if (shortDescription !== undefined) {
      model.shortDescription = shortDescription;
    }
    if (longDescription !== undefined) {
      model.longDescription = longDescription;
    }
    if (example !== undefined) {
      model.example = example;
    }
    if (visibility !== undefined) {
      model.visibility = visibility;
    }
    if (typeof command.runnable === "boolean") {
      model.runnable = command.runnable;
    }
    // `handlerPresent` became a nullable `handler` descriptor object.
    if (command.handler !== undefined) {
      model.handlerPresent = isPlainObject(command.handler);
    }
    if (lifecycle !== undefined) {
      model.lifecycle = lifecycle;
    }
    const flags = cliFlagsFromCommand(command, flagUsageById);
    if (flags.length > 0) {
      model.flags = flags;
    }
    const commandArguments = cliArgumentsFromCommand(command);
    if (commandArguments.length > 0) {
      model.arguments = commandArguments;
    }

    try {
      commands.push(createCliCommandNormalized(model));
    } catch (cause) {
      throw wrapModelError(`Malformed CLI command at ${field}`, cause);
    }
  }

  return commands;
}

/**
 * Authored MCP tool example from published contract fields when present.
 * Prefer `example`, else the first entry of `examples`. Does not invent values.
 */
function authoredMcpToolExample(
  tool: Record<string, unknown>,
): unknown | undefined {
  if (tool.example !== undefined) {
    return tool.example;
  }
  if (Array.isArray(tool.examples) && tool.examples.length > 0) {
    return tool.examples[0];
  }
  return undefined;
}

/**
 * Normalize MCP tools inventory data into tool models.
 * Expects the structured object from `@you-agent-factory/api/mcp`.
 */
export function normalizeMcpToolsFromArtifact(
  data: unknown,
  options: {
    publicArtifactId?: string;
    sourcePath?: string;
  } = {},
): McpToolNormalized[] {
  const root = requirePlainObject(data, "mcp");
  const toolsValue = root.tools;
  if (toolsValue === undefined) {
    return [];
  }
  if (!Array.isArray(toolsValue)) {
    throw new FamilyArtifactNormalizeError(
      "malformed-artifact",
      `Malformed MCP artifact: field "tools" must be an array.`,
      { field: "tools" },
    );
  }

  const publicArtifactId =
    options.publicArtifactId ?? toApiPackageExportSpecifier("mcp");
  const tools: McpToolNormalized[] = [];

  for (const [index, entry] of toolsValue.entries()) {
    const tool = requirePlainObject(entry, `tools[${index}]`);
    const idCandidate = optionalNonEmptyString(tool.idCandidate);
    const name = optionalNonEmptyString(tool.name);
    if (idCandidate === undefined || name === undefined) {
      throw new FamilyArtifactNormalizeError(
        "malformed-artifact",
        `Malformed MCP tool at tools[${index}]: idCandidate and name are required.`,
        { field: `tools[${index}]` },
      );
    }

    const description = optionalNonEmptyString(tool.description);
    const lifecycle = lifecycleFromStringOrObject(
      tool.lifecycle,
      `tools[${index}].lifecycle`,
    );

    const source = sourcePointer(
      publicArtifactId,
      `/tools/${index}`,
      options.sourcePath,
    );

    let inputSchema: ReturnType<typeof projectMcpInputSchemaToDefinition>;
    try {
      inputSchema = projectMcpInputSchemaToDefinition(tool.inputSchema, {
        address: {
          publicArtifactId,
          pointer: `${source.pointer}/inputSchema`,
        },
        title: `${name} input`,
        ...(description !== undefined ? { description } : {}),
      });
    } catch (cause) {
      if (cause instanceof McpInputSchemaProjectionError) {
        throw new FamilyArtifactNormalizeError(
          "malformed-artifact",
          `Malformed MCP tool at tools[${index}]: ${cause.message}`,
          { field: `tools[${index}].inputSchema`, cause },
        );
      }
      throw cause;
    }

    const requiredInputs = requiredInputsFromDefinition(inputSchema);
    const authoredExample = authoredMcpToolExample(tool);

    const model: McpToolNormalized = {
      id: idCandidate,
      name,
      source,
      anchor: provisionalAnchorFromIdentity(name),
    };

    if (description !== undefined) {
      model.description = description;
    }
    if (lifecycle !== undefined) {
      model.lifecycle = lifecycle;
    }
    if (typeof tool.handlerRegistered === "boolean") {
      model.handlerRegistered = tool.handlerRegistered;
    }
    if (requiredInputs !== undefined) {
      model.requiredInputs = requiredInputs;
    }
    if (inputSchema !== undefined) {
      model.inputSchema = inputSchema;
    }
    if (authoredExample !== undefined) {
      model.example = authoredExample;
    }

    try {
      tools.push(createMcpToolNormalized(model));
    } catch (cause) {
      throw wrapModelError(`Malformed MCP tool at tools[${index}]`, cause);
    }
  }

  return tools;
}

/**
 * Normalize JavaScript runtime API data into symbol models.
 * Expects the structured object from `@you-agent-factory/api/javascript/runtime`.
 */
export function normalizeJavascriptSymbolsFromArtifact(
  data: unknown,
  options: {
    publicArtifactId?: string;
    sourcePath?: string;
  } = {},
): JavascriptSymbolNormalized[] {
  const root = requirePlainObject(data, "javascript/runtime");
  const symbolsValue = root.symbols;
  if (symbolsValue === undefined) {
    return [];
  }
  const symbolsMap = requirePlainObject(symbolsValue, "symbols");
  const publicArtifactId =
    options.publicArtifactId ??
    toApiPackageExportSpecifier("javascript/runtime");

  const symbols: JavascriptSymbolNormalized[] = [];

  for (const [key, entry] of Object.entries(symbolsMap)) {
    const symbol = requirePlainObject(entry, `symbols.${key}`);
    const id = optionalNonEmptyString(symbol.id) ?? key;
    const name = optionalNonEmptyString(symbol.name);
    const symbolPath = optionalNonEmptyString(symbol.path) ?? key;
    if (name === undefined) {
      throw new FamilyArtifactNormalizeError(
        "malformed-artifact",
        `Malformed JavaScript symbol at symbols.${key}: name is required.`,
        { field: `symbols.${key}.name` },
      );
    }

    const kind = optionalNonEmptyString(symbol.kind);
    const documentation = readJavascriptDocumentation(symbol);
    const lifecycle = lifecycleFromStringOrObject(
      symbol.lifecycle,
      `symbols.${key}.lifecycle`,
    );
    const mutability = optionalNonEmptyString(symbol.mutability);
    const nullability = optionalNonEmptyString(symbol.nullability);
    const bindingLifecycle = optionalNonEmptyString(symbol.bindingLifecycle);
    const sharedSchemaLinks = collectJavascriptSharedSchemaLinks(symbol);

    const model: JavascriptSymbolNormalized = {
      id,
      name,
      symbolPath,
      source: sourcePointer(
        publicArtifactId,
        `/symbols/${encodeJsonPointerSegment(key)}`,
        options.sourcePath,
      ),
      anchor: provisionalAnchorFromIdentity(id),
    };

    if (kind !== undefined) {
      model.kind = kind;
    }
    if (documentation.description !== undefined) {
      model.description = documentation.description;
    }
    if (documentation.visibility !== undefined) {
      model.visibility = documentation.visibility;
    }
    if (documentation.examples !== undefined) {
      model.examples = documentation.examples;
    }
    if (mutability !== undefined) {
      model.mutability = mutability;
    }
    if (nullability !== undefined) {
      model.nullability = nullability;
    }
    if (bindingLifecycle !== undefined) {
      model.bindingLifecycle = bindingLifecycle;
    }
    if (sharedSchemaLinks.length > 0) {
      model.sharedSchemaLinks = sharedSchemaLinks;
    }
    if (lifecycle !== undefined) {
      model.lifecycle = lifecycle;
    }

    try {
      symbols.push(createJavascriptSymbolNormalized(model));
    } catch (cause) {
      throw wrapModelError(
        `Malformed JavaScript symbol at symbols.${key}`,
        cause,
      );
    }
  }

  return symbols;
}

/**
 * Normalize JavaScript runtime `sharedSchemas` into shared schema models.
 * Expects the structured object from `@you-agent-factory/api/javascript/runtime`.
 */
export function normalizeJavascriptSharedSchemasFromArtifact(
  data: unknown,
  options: {
    publicArtifactId?: string;
    sourcePath?: string;
  } = {},
): JavascriptSharedSchemaNormalized[] {
  const root = requirePlainObject(data, "javascript/runtime");
  const sharedValue = root.sharedSchemas;
  if (sharedValue === undefined) {
    return [];
  }
  const sharedMap = requirePlainObject(sharedValue, "sharedSchemas");
  const publicArtifactId =
    options.publicArtifactId ??
    toApiPackageExportSpecifier("javascript/runtime");

  const schemas: JavascriptSharedSchemaNormalized[] = [];

  for (const [key, entry] of Object.entries(sharedMap)) {
    const shared = requirePlainObject(entry, `sharedSchemas.${key}`);
    const id = optionalNonEmptyString(shared.id) ?? key;
    const documentation = readJavascriptDocumentation(shared);
    const lifecycle = lifecycleFromStringOrObject(
      shared.lifecycle,
      `sharedSchemas.${key}.lifecycle`,
    );
    const name =
      documentation.title ??
      sharedSchemaDisplayName(id) ??
      optionalNonEmptyString(shared.name) ??
      id;

    let schema: ReturnType<typeof projectMcpInputSchemaToDefinition>;
    try {
      schema = projectMcpInputSchemaToDefinition(shared.schema, {
        address: {
          publicArtifactId,
          pointer: `/sharedSchemas/${encodeJsonPointerSegment(key)}/schema`,
        },
        title: documentation.title,
        description: documentation.description,
      });
    } catch (cause) {
      if (cause instanceof McpInputSchemaProjectionError) {
        throw new FamilyArtifactNormalizeError(
          "malformed-artifact",
          `Malformed JavaScript shared schema at sharedSchemas.${key}: ${cause.message}`,
          { field: `sharedSchemas.${key}.schema`, cause },
        );
      }
      throw cause;
    }

    const model: JavascriptSharedSchemaNormalized = {
      id,
      name,
      source: sourcePointer(
        publicArtifactId,
        `/sharedSchemas/${encodeJsonPointerSegment(key)}`,
        options.sourcePath,
      ),
      anchor: provisionalAnchorFromIdentity(id),
    };

    if (documentation.title !== undefined) {
      model.title = documentation.title;
    }
    if (documentation.description !== undefined) {
      model.description = documentation.description;
    }
    if (documentation.visibility !== undefined) {
      model.visibility = documentation.visibility;
    }
    if (documentation.examples !== undefined) {
      model.examples = documentation.examples;
    }
    if (schema !== undefined) {
      model.schema = schema;
    }
    if (lifecycle !== undefined) {
      model.lifecycle = lifecycle;
    }

    try {
      schemas.push(createJavascriptSharedSchemaNormalized(model));
    } catch (cause) {
      throw wrapModelError(
        `Malformed JavaScript shared schema at sharedSchemas.${key}`,
        cause,
      );
    }
  }

  return schemas;
}

type JavascriptDocumentationFields = {
  description?: string;
  title?: string;
  visibility?: string;
  examples?: string[];
};

function readJavascriptDocumentation(
  item: Record<string, unknown>,
): JavascriptDocumentationFields {
  const documentation = item.documentation;
  if (!isPlainObject(documentation)) {
    return {};
  }

  const result: JavascriptDocumentationFields = {};
  const nested = documentation.documentation;
  if (isPlainObject(nested)) {
    const description = nested.description;
    if (isPlainObject(description)) {
      const canonical = optionalNonEmptyString(description.canonicalEnglish);
      if (canonical !== undefined) {
        result.description = canonical;
      }
    } else {
      const plain = optionalNonEmptyString(description);
      if (plain !== undefined) {
        result.description = plain;
      }
    }

    const title = nested.title;
    if (isPlainObject(title)) {
      const canonical = optionalNonEmptyString(title.canonicalEnglish);
      if (canonical !== undefined) {
        result.title = canonical;
      }
    } else {
      const plain = optionalNonEmptyString(title);
      if (plain !== undefined) {
        result.title = plain;
      }
    }
  }

  const visibility = optionalNonEmptyString(documentation.visibility);
  if (visibility !== undefined) {
    result.visibility = visibility;
  }

  if (Array.isArray(documentation.examples)) {
    const examples = documentation.examples
      .map((entry) => optionalNonEmptyString(entry))
      .filter((entry): entry is string => entry !== undefined);
    if (examples.length > 0) {
      result.examples = examples;
    }
  }

  return result;
}

/**
 * Extract `#/sharedSchemas/{id}/schema` identities from a published symbol
 * surface. Dedupes by schema id; never invents refs that are not present.
 */
export function collectJavascriptSharedSchemaLinks(
  value: unknown,
): JavascriptSharedSchemaLink[] {
  const found = new Map<string, JavascriptSharedSchemaLink>();

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const entry of node) {
        visit(entry);
      }
      return;
    }
    if (!isPlainObject(node)) {
      return;
    }
    const ref = optionalNonEmptyString(node.$ref);
    if (ref !== undefined) {
      const schemaId = sharedSchemaIdFromRef(ref);
      if (schemaId !== undefined && !found.has(schemaId)) {
        found.set(schemaId, {
          schemaId,
          ref,
          anchor: provisionalAnchorFromIdentity(schemaId),
        });
      }
    }
    for (const entry of Object.values(node)) {
      visit(entry);
    }
  };

  visit(value);
  return [...found.values()];
}

/** Parse `#/sharedSchemas/{id}/schema` (or similar) into the shared schema id. */
export function sharedSchemaIdFromRef(ref: string): string | undefined {
  const trimmed = ref.trim();
  const match = trimmed.match(/^#\/sharedSchemas\/([^/]+)(?:\/|$)/);
  if (match === null) {
    return undefined;
  }
  const encoded = match[1];
  if (encoded === undefined || encoded.length === 0) {
    return undefined;
  }
  return encoded.replace(/~1/g, "/").replace(/~0/g, "~");
}

function sharedSchemaDisplayName(id: string): string | undefined {
  const leaf = id.split(".").pop();
  return optionalNonEmptyString(leaf);
}

/**
 * Normalize FactoryEvent discriminator mappings from OpenAPI document data.
 * Expects the structured object from `@you-agent-factory/api/openapi`.
 */
export function normalizeEventTypesFromOpenApiArtifact(
  data: unknown,
  options: {
    publicArtifactId?: string;
    sourcePath?: string;
    /** Schema component name that owns the event discriminator. */
    envelopeSchemaName?: string;
  } = {},
): EventTypeNormalized[] {
  const root = requirePlainObject(data, "openapi");
  const components = requirePlainObject(root.components ?? {}, "components");
  const schemas = requirePlainObject(
    components.schemas ?? {},
    "components.schemas",
  );
  const envelopeName = options.envelopeSchemaName ?? "FactoryEvent";
  const envelope = schemas[envelopeName];
  if (envelope === undefined) {
    return [];
  }
  const envelopeObject = requirePlainObject(
    envelope,
    `components.schemas.${envelopeName}`,
  );
  const discriminator = envelopeObject.discriminator;
  if (discriminator === undefined) {
    return [];
  }
  const discriminatorObject = requirePlainObject(
    discriminator,
    `components.schemas.${envelopeName}.discriminator`,
  );
  const mapping = discriminatorObject.mapping;
  if (mapping === undefined) {
    return [];
  }
  const mappingObject = requirePlainObject(
    mapping,
    `components.schemas.${envelopeName}.discriminator.mapping`,
  );

  const publicArtifactId =
    options.publicArtifactId ?? toApiPackageExportSpecifier("openapi");
  const events: EventTypeNormalized[] = [];

  for (const [eventType, payloadRefValue] of Object.entries(mappingObject)) {
    const payloadSchemaRef = optionalNonEmptyString(payloadRefValue);
    if (payloadSchemaRef === undefined) {
      throw new FamilyArtifactNormalizeError(
        "malformed-artifact",
        `Malformed event mapping for "${eventType}": payload $ref must be a non-empty string.`,
        {
          field: `components.schemas.${envelopeName}.discriminator.mapping.${eventType}`,
        },
      );
    }

    const model: EventTypeNormalized = {
      id: `events.${eventType}`,
      eventType,
      payloadSchemaRef,
      source: sourcePointer(
        publicArtifactId,
        `/components/schemas/${encodeJsonPointerSegment(envelopeName)}/discriminator/mapping/${encodeJsonPointerSegment(eventType)}`,
        options.sourcePath,
      ),
      anchor: provisionalAnchorFromIdentity(eventType),
    };

    try {
      events.push(createEventTypeNormalized(model));
    } catch (cause) {
      throw wrapModelError(`Malformed event type "${eventType}"`, cause);
    }
  }

  return events;
}

function wrapModelError(
  prefix: string,
  cause: unknown,
): FamilyArtifactNormalizeError {
  if (cause instanceof FamilyNormalizedModelParseError) {
    return new FamilyArtifactNormalizeError(
      "malformed-artifact",
      `${prefix}: ${cause.message}`,
      { field: cause.field, cause },
    );
  }
  return new FamilyArtifactNormalizeError("malformed-artifact", `${prefix}.`, {
    cause,
  });
}
