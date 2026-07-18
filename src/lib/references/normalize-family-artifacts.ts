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
  type CliCommandNormalized,
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
 * Normalize CLI command inventory data into command models.
 * Expects the structured object from `@you-agent-factory/api/cli`.
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
  if (!Array.isArray(commandsValue)) {
    throw new FamilyArtifactNormalizeError(
      "malformed-artifact",
      `Malformed CLI artifact: field "commands" must be an array.`,
      { field: "commands" },
    );
  }

  const publicArtifactId =
    options.publicArtifactId ?? toApiPackageExportSpecifier("cli");
  const commands: CliCommandNormalized[] = [];

  for (const [index, entry] of commandsValue.entries()) {
    const command = requirePlainObject(entry, `commands[${index}]`);
    const idCandidate = optionalNonEmptyString(command.idCandidate);
    const name = optionalNonEmptyString(command.name);
    const commandPath = optionalNonEmptyString(command.path);
    if (
      idCandidate === undefined ||
      name === undefined ||
      commandPath === undefined
    ) {
      throw new FamilyArtifactNormalizeError(
        "malformed-artifact",
        `Malformed CLI command at commands[${index}]: idCandidate, name, and path are required.`,
        { field: `commands[${index}]` },
      );
    }

    const aliasesRaw = command.aliases;
    const aliases: string[] = [];
    if (aliasesRaw !== undefined) {
      if (!Array.isArray(aliasesRaw)) {
        throw new FamilyArtifactNormalizeError(
          "malformed-artifact",
          `Malformed CLI command at commands[${index}]: aliases must be an array.`,
          { field: `commands[${index}].aliases` },
        );
      }
      for (const alias of aliasesRaw) {
        const normalized = optionalNonEmptyString(alias);
        if (normalized !== undefined) {
          aliases.push(normalized);
        }
      }
    }

    // Prefer short help text; fall back to long. Empty package strings stay absent.
    const shortDescription = optionalNonEmptyString(command.short);
    const longDescription = optionalNonEmptyString(command.long);
    const description = shortDescription ?? longDescription;
    const example = optionalNonEmptyString(command.example);
    const visibility = optionalNonEmptyString(command.visibility);

    const lifecycle = lifecycleFromStringOrObject(
      command.lifecycle,
      `commands[${index}].lifecycle`,
    );

    const model: CliCommandNormalized = {
      id: idCandidate,
      name,
      commandPath,
      aliases,
      source: sourcePointer(
        publicArtifactId,
        `/commands/${index}`,
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
    if (typeof command.handlerPresent === "boolean") {
      model.handlerPresent = command.handlerPresent;
    }
    if (lifecycle !== undefined) {
      model.lifecycle = lifecycle;
    }

    try {
      commands.push(createCliCommandNormalized(model));
    } catch (cause) {
      throw wrapModelError(
        `Malformed CLI command at commands[${index}]`,
        cause,
      );
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
