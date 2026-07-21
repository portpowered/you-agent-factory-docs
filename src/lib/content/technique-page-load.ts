import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TOCItemType } from "fumadocs-core/toc";
import type { MDXComponents } from "mdx/types";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";
import { parsePageAssetConfig } from "@/lib/content/assets";
import { TECHNIQUES_DOCS_ROOT } from "@/lib/content/content-paths";
import { moduleMdxCompileOptions } from "@/lib/content/mdx-compile-options";
import { moduleMdxComponents } from "@/lib/content/mdx-components";
import { loadPageMessages } from "@/lib/content/page-messages-load";
import { syncGraphRegistryForContentRoot } from "@/lib/content/root-graph-registry-load";
import {
  type PageAssetConfig,
  type PageFrontmatter,
  type PageMessages,
  pageFrontmatterSchema,
} from "@/lib/content/schemas";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import { buildLocalDocsTableOfContents } from "@/lib/navigation/local-docs-toc";

export type LoadedTechniquePage = {
  frontmatter: PageFrontmatter;
  messages: PageMessages;
  assets: PageAssetConfig;
  content: ReactElement;
  toc: TOCItemType[];
};

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/**
 * Merge page-owned MDX components for a technique slug.
 *
 * Local docs compile through `compileMDX` with a fixed component map, so
 * relative imports in `page.mdx` do not resolve. Use a static
 * `import("@/content/docs/techniques/<slug>/page-mdx-components")` literal
 * (webpack cannot resolve expression-based imports at build time). Keep page
 * mounts out of the shared `mdx-components.tsx` registry.
 */
async function loadTechniquePageMdxComponents(
  slug: string,
): Promise<MDXComponents> {
  switch (slug) {
    case "planner-executor-in-action": {
      const mod = await import(
        "@/content/docs/techniques/planner-executor-in-action/page-mdx-components"
      );
      return mod.pageMdxComponents ?? {};
    }
    default:
      return {};
  }
}

export async function loadTechniquePageFromDisk(
  slug: string,
  locale: SiteLocale = defaultLocale,
  techniquesDocsRoot = TECHNIQUES_DOCS_ROOT,
): Promise<LoadedTechniquePage> {
  const pageDir = join(techniquesDocsRoot, slug);
  const mdxPath = join(pageDir, "page.mdx");
  const assetsPath = join(pageDir, "assets.json");
  const route = buildLocalizedRoute(
    { surface: "docs-page", slug: `techniques/${slug}` },
    locale,
  );

  const source = readFileSync(mdxPath, "utf8");
  const messages = await loadPageMessages(pageDir, locale, { route });
  const assets = parsePageAssetConfig(readJsonFile(assetsPath));
  syncGraphRegistryForContentRoot(join(techniquesDocsRoot, "..", ".."));
  const pageMdxComponents = await loadTechniquePageMdxComponents(slug);

  const { content, frontmatter } = await compileMDX<PageFrontmatter>({
    source,
    components: {
      ...moduleMdxComponents,
      ...pageMdxComponents,
    },
    options: moduleMdxCompileOptions,
  });

  return {
    frontmatter: pageFrontmatterSchema.parse(frontmatter),
    messages,
    assets,
    content,
    toc: buildLocalDocsTableOfContents(source, messages),
  };
}
