import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { blogCalendarDateSchema } from "./blog-frontmatter";
import { REGISTRY_ROOT } from "./content-paths";

/**
 * Commit-only teaching model pricing records (`kind: "model-pricing"`).
 * Kept out of the main page `registryKindSchema` union — dedicated schema +
 * loaders only (see docs/temp/graph-pages/registries.md).
 */
export const modelPricingRecordSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("model-pricing"),
  providerId: z.string().min(1),
  displayName: z.string().min(1),
  inputPricePerMTok: z.number().finite().nonnegative(),
  outputPricePerMTok: z.number().finite().nonnegative(),
  currency: z.literal("USD"),
  asOf: blogCalendarDateSchema,
  defaultSummaryKey: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
});

export type ModelPricingRecord = z.infer<typeof modelPricingRecordSchema>;

/** Default commit-only pricing tree: `src/content/registry/models`. */
export const MODEL_PRICING_ROOT = join(REGISTRY_ROOT, "models");

export type ListModelPricingOptions = {
  /** Models root override for fixture tests (defaults to {@link MODEL_PRICING_ROOT}). */
  modelsRoot?: string;
};

function formatIssuePath(path: ReadonlyArray<PropertyKey>): string {
  return path.length === 0 ? "<root>" : path.map(String).join(".");
}

function collectJsonFiles(directoryPath: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function isModelPricingCandidate(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === "model-pricing"
  );
}

function parseModelPricingRecord(
  sourcePath: string,
  value: unknown,
): ModelPricingRecord {
  const parsed = modelPricingRecordSchema.safeParse(value);

  if (parsed.success) {
    return parsed.data;
  }

  const issues = parsed.error.issues
    .map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`)
    .join("; ");
  throw new Error(
    `Model pricing schema validation failed for ${sourcePath}: ${issues}`,
  );
}

/**
 * Load all commit-only `kind: "model-pricing"` records under `registry/models/**`.
 *
 * Reads local JSON only (no network). Optional provider metadata JSON without
 * `kind: "model-pricing"` is skipped. Invalid model-pricing records throw.
 */
export function listModelPricing(
  options: ListModelPricingOptions = {},
): ModelPricingRecord[] {
  const modelsRoot = options.modelsRoot ?? MODEL_PRICING_ROOT;
  if (!existsSync(modelsRoot)) {
    return [];
  }

  const records: ModelPricingRecord[] = [];
  const sourcesById = new Map<string, string>();

  for (const sourcePath of collectJsonFiles(modelsRoot)) {
    const value = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
    if (!isModelPricingCandidate(value)) {
      continue;
    }

    const record = parseModelPricingRecord(sourcePath, value);
    const existingSource = sourcesById.get(record.id);
    if (existingSource) {
      throw new Error(
        `Duplicate model pricing id "${record.id}" found in: ${existingSource}, ${sourcePath}`,
      );
    }

    sourcesById.set(record.id, sourcePath);
    records.push(record);
  }

  return records.sort((left, right) => left.id.localeCompare(right.id));
}

/**
 * Resolve one pricing record by id.
 *
 * Missing ids return `undefined` (explicit policy — callers choose defaults /
 * UI empty states; do not throw).
 */
export function getModelPricing(
  id: string,
  options: ListModelPricingOptions = {},
): ModelPricingRecord | undefined {
  return listModelPricing(options).find((record) => record.id === id);
}
