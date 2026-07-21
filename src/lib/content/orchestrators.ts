import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { getRegistryRoot } from "./content-paths";

/**
 * Orchestrator feature registry schemas, loaders, and attribute agreement
 * validation.
 *
 * Locked contract: docs/temp/graph-pages/registries.md + contracts.md
 * (AttributeDef / AttributeDefsFile / OrchestratorRecord).
 * Filter/sort helpers land in a later story.
 */

const ATTRIBUTE_DEFS_FILE_NAME = "attribute-defs.json";

export const attributeTypeSchema = z.enum([
  "boolean",
  "string",
  "single-tag",
  "multi-tag",
]);

const attributeDefBaseSchema = z.object({
  id: z.string().min(1),
  labelKey: z.string().min(1),
  type: attributeTypeSchema,
  tagEnum: z.array(z.string().min(1)).min(1).optional(),
  filterable: z.boolean(),
  sortable: z.boolean(),
  order: z.number().int(),
});

export const attributeDefSchema = attributeDefBaseSchema.superRefine(
  (def, ctx) => {
    if (def.type === "single-tag" || def.type === "multi-tag") {
      if (def.tagEnum === undefined || def.tagEnum.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `AttributeDef "${def.id}" of type "${def.type}" requires a non-empty tagEnum`,
          path: ["tagEnum"],
        });
      }
    }
  },
);

export const attributeDefsFileSchema = z.object({
  attributes: z.array(attributeDefSchema),
});

export const orchestratorAttributeValueSchema = z.union([
  z.boolean(),
  z.string(),
  z.array(z.string()),
]);

export const orchestratorRecordSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("orchestrator"),
  name: z.string().min(1),
  attributes: z.record(z.string(), orchestratorAttributeValueSchema),
  tags: z.array(z.string()).optional(),
  defaultSummaryKey: z.string().min(1).optional(),
});

export type AttributeType = z.infer<typeof attributeTypeSchema>;
export type AttributeDef = z.infer<typeof attributeDefSchema>;
export type AttributeDefsFile = z.infer<typeof attributeDefsFileSchema>;
export type OrchestratorAttributeValue = z.infer<
  typeof orchestratorAttributeValueSchema
>;
export type OrchestratorRecord = z.infer<typeof orchestratorRecordSchema>;

/** Directory for attribute-defs.json and orchestrator.*.json records. */
export function getOrchestratorsRegistryRoot(
  registryRoot = getRegistryRoot(),
): string {
  return join(registryRoot, "orchestrators");
}

export class OrchestratorRegistryLoadError extends Error {
  readonly path: string;
  readonly causeMessage: string;

  constructor(message: string, path: string, causeMessage: string) {
    super(message);
    this.name = "OrchestratorRegistryLoadError";
    this.path = path;
    this.causeMessage = causeMessage;
  }
}

function readJsonFile(path: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    const causeMessage = error instanceof Error ? error.message : String(error);
    throw new OrchestratorRegistryLoadError(
      `Failed to read orchestrator registry file: ${path}`,
      path,
      causeMessage,
    );
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const causeMessage = error instanceof Error ? error.message : String(error);
    throw new OrchestratorRegistryLoadError(
      `Invalid JSON in orchestrator registry file: ${path}`,
      path,
      causeMessage,
    );
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  value: unknown,
  path: string,
  label: string,
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const causeMessage = formatZodError(result.error);
    throw new OrchestratorRegistryLoadError(
      `Failed to parse ${label} at ${path}: ${causeMessage}`,
      path,
      causeMessage,
    );
  }
  return result.data;
}

function isOrchestratorRecordFileName(fileName: string): boolean {
  return (
    fileName.startsWith("orchestrator.") &&
    fileName.endsWith(".json") &&
    fileName !== ATTRIBUTE_DEFS_FILE_NAME
  );
}

/**
 * Load attribute defs from `attribute-defs.json`, ordered by `order` ascending.
 * Equal `order` values keep a stable relative order (Array.prototype.sort).
 */
export function listAttributeDefs(
  orchestratorsRoot = getOrchestratorsRegistryRoot(),
): AttributeDef[] {
  const path = join(orchestratorsRoot, ATTRIBUTE_DEFS_FILE_NAME);
  const file = parseWithSchema(
    attributeDefsFileSchema,
    readJsonFile(path),
    path,
    "attribute defs",
  );
  return [...file.attributes].sort((left, right) => left.order - right.order);
}

/**
 * Load `orchestrator.*.json` records under the orchestrators registry directory.
 * Excludes `attribute-defs.json`. Results are sorted by record id for stable output.
 */
export function listOrchestrators(
  orchestratorsRoot = getOrchestratorsRegistryRoot(),
): OrchestratorRecord[] {
  let fileNames: string[];
  try {
    fileNames = readdirSync(orchestratorsRoot);
  } catch (error) {
    const causeMessage = error instanceof Error ? error.message : String(error);
    throw new OrchestratorRegistryLoadError(
      `Failed to read orchestrator registry directory: ${orchestratorsRoot}`,
      orchestratorsRoot,
      causeMessage,
    );
  }

  const recordFileNames = fileNames
    .filter(isOrchestratorRecordFileName)
    .sort((left, right) => left.localeCompare(right));

  const records = recordFileNames.map((fileName) => {
    const path = join(orchestratorsRoot, fileName);
    return parseWithSchema(
      orchestratorRecordSchema,
      readJsonFile(path),
      path,
      "orchestrator record",
    );
  });

  return records.sort((left, right) => left.id.localeCompare(right.id));
}

/** Structured validation issue for orchestrator attribute↔def agreement. */
export type OrchestratorValidationError = {
  code: string;
  message: string;
  path?: string;
};

export type ValidateOrchestratorAttributeAgreementOptions = {
  attributeDefsPath?: string;
  recordPath?: (record: OrchestratorRecord) => string | undefined;
};

function describeValueShape(value: OrchestratorAttributeValue): string {
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (typeof value === "string") {
    return "string";
  }
  return "string[]";
}

/**
 * Assert every orchestrator attribute key exists in attribute defs and that
 * each value matches the def type / tagEnum (registries.md).
 */
export function validateOrchestratorAttributeAgreement(
  attributeDefs: readonly AttributeDef[],
  orchestrators: readonly OrchestratorRecord[],
  options: ValidateOrchestratorAttributeAgreementOptions = {},
): OrchestratorValidationError[] {
  const errors: OrchestratorValidationError[] = [];
  const defsById = new Map(attributeDefs.map((def) => [def.id, def]));

  for (const def of attributeDefs) {
    if (def.type !== "single-tag" && def.type !== "multi-tag") {
      continue;
    }
    if (def.tagEnum === undefined || def.tagEnum.length === 0) {
      errors.push({
        code: "orchestrator-attribute-def-missing-tag-enum",
        message: `AttributeDef "${def.id}" of type "${def.type}" requires a non-empty tagEnum`,
        path: options.attributeDefsPath,
      });
    }
  }

  for (const record of orchestrators) {
    const path = options.recordPath?.(record);
    for (const [attributeId, value] of Object.entries(record.attributes)) {
      const def = defsById.get(attributeId);
      if (!def) {
        errors.push({
          code: "unknown-orchestrator-attribute",
          message: `${record.id}: attributes key "${attributeId}" is not defined in attribute-defs`,
          path,
        });
        continue;
      }

      switch (def.type) {
        case "boolean": {
          if (typeof value !== "boolean") {
            errors.push({
              code: "orchestrator-attribute-type-mismatch",
              message: `${record.id}: attribute "${attributeId}" expects boolean, got ${describeValueShape(value)}`,
              path,
            });
          }
          break;
        }
        case "string": {
          if (typeof value !== "string") {
            errors.push({
              code: "orchestrator-attribute-type-mismatch",
              message: `${record.id}: attribute "${attributeId}" expects string, got ${describeValueShape(value)}`,
              path,
            });
          }
          break;
        }
        case "single-tag": {
          if (typeof value !== "string") {
            errors.push({
              code: "orchestrator-attribute-type-mismatch",
              message: `${record.id}: attribute "${attributeId}" expects single-tag string, got ${describeValueShape(value)}`,
              path,
            });
            break;
          }
          if (def.tagEnum && !def.tagEnum.includes(value)) {
            errors.push({
              code: "orchestrator-attribute-tag-out-of-enum",
              message: `${record.id}: attribute "${attributeId}" value "${value}" is outside tagEnum [${def.tagEnum.join(", ")}]`,
              path,
            });
          }
          break;
        }
        case "multi-tag": {
          if (!Array.isArray(value)) {
            errors.push({
              code: "orchestrator-attribute-type-mismatch",
              message: `${record.id}: attribute "${attributeId}" expects multi-tag string[], got ${describeValueShape(value)}`,
              path,
            });
            break;
          }
          if (!def.tagEnum || def.tagEnum.length === 0) {
            break;
          }
          for (const tag of value) {
            if (!def.tagEnum.includes(tag)) {
              errors.push({
                code: "orchestrator-attribute-tag-out-of-enum",
                message: `${record.id}: attribute "${attributeId}" tag "${tag}" is outside tagEnum [${def.tagEnum.join(", ")}]`,
                path,
              });
            }
          }
          break;
        }
        default: {
          const _exhaustive: never = def.type;
          throw new Error(`Unexpected attribute type: ${String(_exhaustive)}`);
        }
      }
    }
  }

  return errors;
}

/**
 * Load the orchestrators registry directory and validate attribute type/value
 * agreement. Missing directory is a no-op (same pattern as table registry).
 * Load/parse failures become validation errors instead of thrown exceptions.
 */
export function validateOrchestratorsRegistry(
  orchestratorsRoot = getOrchestratorsRegistryRoot(),
): OrchestratorValidationError[] {
  if (!existsSync(orchestratorsRoot)) {
    return [];
  }

  let attributeDefs: AttributeDef[];
  let orchestrators: OrchestratorRecord[];
  try {
    attributeDefs = listAttributeDefs(orchestratorsRoot);
    orchestrators = listOrchestrators(orchestratorsRoot);
  } catch (error) {
    if (error instanceof OrchestratorRegistryLoadError) {
      return [
        {
          code: "orchestrator-registry-load-error",
          message: error.message,
          path: error.path,
        },
      ];
    }
    throw error;
  }

  return validateOrchestratorAttributeAgreement(attributeDefs, orchestrators, {
    attributeDefsPath: join(orchestratorsRoot, ATTRIBUTE_DEFS_FILE_NAME),
    recordPath: (record) => join(orchestratorsRoot, `${record.id}.json`),
  });
}
