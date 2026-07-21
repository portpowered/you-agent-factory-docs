import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { getRegistryRoot } from "./content-paths";

/**
 * Orchestrator feature registry schemas and loaders.
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
