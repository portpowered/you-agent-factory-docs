import { z } from "zod";
import { blogCalendarDateSchema } from "./blog-frontmatter";

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
