import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TOCItemType } from "fumadocs-core/toc";
import type { MDXComponents } from "mdx/types";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";
import { parsePageAssetConfig } from "@/lib/content/assets";
import { DOCUMENTATION_DOCS_ROOT } from "@/lib/content/content-paths";
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

export type LoadedDocumentationPage = {
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
 * Merge page-owned MDX components for a documentation slug.
 *
 * Local docs compile through `compileMDX` with a fixed component map, so
 * relative imports in `page.mdx` do not resolve. Use a static
 * `import("@/content/docs/documentation/<slug>/page-mdx-components")` literal
 * (webpack cannot resolve expression-based imports at build time). Keep page
 * visuals out of the shared `mdx-components.tsx` registry.
 */
async function loadDocumentationPageMdxComponents(
  slug: string,
): Promise<MDXComponents> {
  switch (slug) {
    case "architecture-of-system": {
      const mod = await import(
        "@/content/docs/documentation/architecture-of-system/page-mdx-components"
      );
      return mod.pageMdxComponents ?? {};
    }
    case "harness-support": {
      const mod = await import(
        "@/content/docs/documentation/harness-support/page-mdx-components"
      );
      return mod.pageMdxComponents ?? {};
    }
    case "metrics": {
      const mod = await import(
        "@/content/docs/documentation/metrics/page-mdx-components"
      );
      return mod.pageMdxComponents ?? {};
    }
    default:
      return {};
  }
}

export async function loadDocumentationPageFromDisk(
  slug: string,
  locale: SiteLocale = defaultLocale,
  documentationDocsRoot = DOCUMENTATION_DOCS_ROOT,
): Promise<LoadedDocumentationPage> {
  const pageDir = join(documentationDocsRoot, slug);
  const mdxPath = join(pageDir, "page.mdx");
  const assetsPath = join(pageDir, "assets.json");
  const route = buildLocalizedRoute(
    { surface: "docs-page", slug: `documentation/${slug}` },
    locale,
  );

  const source = readFileSync(mdxPath, "utf8");
  const messages = await loadPageMessages(pageDir, locale, { route });
  const assets = parsePageAssetConfig(readJsonFile(assetsPath));
  syncGraphRegistryForContentRoot(join(documentationDocsRoot, "..", ".."));
  const pageMdxComponents = await loadDocumentationPageMdxComponents(slug);

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
