import { pageSchema } from "fumadocs-core/source/schema";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";

const docsPageSchema = pageSchema.extend({
  kind: z.string().optional(),
  registryId: z.string().optional(),
  messageNamespace: z.union([z.literal("local"), z.string().min(1)]).optional(),
  assetNamespace: z.union([z.literal("local"), z.string().min(1)]).optional(),
  status: z.string().optional(),
});

export const docs = defineDocs({
  dir: "src/content/docs",
  docs: {
    // Glossary and module MDX are catch-all routes only (no per-slug App Router stubs).
    // Local message-key pages render via next-mdx-remote + DocsPageProviders in [[...slug]]/page.tsx.
    files: ["**/*.{md,mdx}"],
    schema: docsPageSchema,
  },
  meta: {
    // Scoped to the conventional filename. The fumadocs default is `**/*.json`,
    // which also swept up colocated data artifacts under `src/content/docs`
    // (generated factory definitions, recordings, message catalogs) and
    // validated them against the meta schema. That passed only by accident:
    // those files had no `description` key until `@you-agent-factory/api` 0.0.6
    // added one as an object, at which point the build failed on data files
    // that were never meta in the first place.
    //
    // The page tree itself is built in code (`buildGeneratedDocsPageTree`), so
    // no meta.json exists today; this keeps the collection honest if one lands.
    files: ["**/meta.json"],
  },
});

export default defineConfig();
