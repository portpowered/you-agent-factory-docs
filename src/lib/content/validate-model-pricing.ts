import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MODEL_PRICING_ROOT, modelPricingRecordSchema } from "./model-pricing";
import type { ValidationError } from "./validate-registry";

export type ValidateModelPricingOptions = {
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

/**
 * Optional provider metadata under `registry/models/**` is allowed and is not
 * validated as model-pricing. Any other JSON must be a valid ModelPricingRecord.
 */
function isOptionalNonPricingRecord(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === "provider"
  );
}

/**
 * Validate commit-only model pricing JSON under `registry/models/**`.
 *
 * Returns ValidationError entries for bad prices, wrong kind/currency, missing
 * fields, invalid JSON, and duplicate ids. Does not perform network I/O.
 */
export function validateModelPricing(
  options: ValidateModelPricingOptions = {},
): ValidationError[] {
  const modelsRoot = options.modelsRoot ?? MODEL_PRICING_ROOT;
  if (!existsSync(modelsRoot)) {
    return [];
  }

  const errors: ValidationError[] = [];
  const sourcesById = new Map<string, string>();

  for (const sourcePath of collectJsonFiles(modelsRoot)) {
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(sourcePath, "utf8")) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        code: "invalid-model-pricing-json",
        message: `Model pricing JSON parse failed for ${sourcePath}: ${message}`,
        path: sourcePath,
      });
      continue;
    }

    if (isOptionalNonPricingRecord(value)) {
      continue;
    }

    const parsed = modelPricingRecordSchema.safeParse(value);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`)
        .join("; ");
      errors.push({
        code: "invalid-model-pricing",
        message: `Model pricing schema validation failed for ${sourcePath}: ${issues}`,
        path: sourcePath,
      });
      continue;
    }

    const existingSource = sourcesById.get(parsed.data.id);
    if (existingSource) {
      errors.push({
        code: "duplicate-model-pricing-id",
        message: `Duplicate model pricing id "${parsed.data.id}" found in: ${existingSource}, ${sourcePath}`,
        path: sourcePath,
      });
      continue;
    }

    sourcesById.set(parsed.data.id, sourcePath);
  }

  return errors;
}
