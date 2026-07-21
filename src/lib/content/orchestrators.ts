import { z } from "zod";

/**
 * Orchestrator feature registry schemas.
 *
 * Locked contract: docs/temp/graph-pages/registries.md + contracts.md
 * (AttributeDef / AttributeDefsFile / OrchestratorRecord).
 * Loaders and filter/sort helpers land in later stories.
 */

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
