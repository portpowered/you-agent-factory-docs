import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TOCItemType } from "fumadocs-core/toc";
import type { MDXComponents } from "mdx/types";
import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";
import { parsePageAssetConfig } from "@/lib/content/assets";
import {
  type DocsSection,
  getContentRoot,
  getDocsPageDir,
  getDocsRoot,
} from "@/lib/content/content-paths";
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

/** Direct route-family sections that share the generic local-docs disk loader. */
export const ROUTE_FAMILY_LOCAL_DOCS_SECTIONS = [
  "references",
  "factories",
  "workers",
  "workstations",
] as const satisfies readonly DocsSection[];

export type RouteFamilyLocalDocsSection =
  (typeof ROUTE_FAMILY_LOCAL_DOCS_SECTIONS)[number];

export type LoadedRouteFamilyLocalDocsPage = {
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
 * Merge page-owned MDX components for a route-family section/slug.
 *
 * Local docs compile through `compileMDX` with a fixed component map, so
 * relative imports in `page.mdx` do not resolve. Use a static
 * `import("@/content/docs/<section>/<slug>/page-mdx-components")` literal
 * (bundlers cannot resolve expression-based imports at build time). Keep page
 * mounts out of the shared `mdx-components.tsx` registry.
 */
async function loadRouteFamilyPageMdxComponents(
  section: RouteFamilyLocalDocsSection,
  slug: string,
): Promise<MDXComponents> {
  if (section === "references" && slug === "cli") {
    const mod = await import(
      "@/content/docs/references/cli/page-mdx-components"
    );
    return mod.pageMdxComponents ?? {};
  }

  if (section === "references" && slug === "mcp") {
    const mod = await import(
      "@/content/docs/references/mcp/page-mdx-components"
    );
    return mod.pageMdxComponents ?? {};
  }

  if (section === "references" && slug === "javascript-runtime") {
    const mod = await import(
      "@/content/docs/references/javascript-runtime/page-mdx-components"
    );
    return mod.pageMdxComponents ?? {};
  }

  if (section === "references" && slug === "events") {
    const mod = await import(
      "@/content/docs/references/events/page-mdx-components"
    );
    return mod.pageMdxComponents ?? {};
  }

  if (section === "workers") {
    switch (slug) {
      case "agent": {
        const mod = await import(
          "@/content/docs/workers/agent/page-mdx-components"
        );
        return mod.pageMdxComponents ?? {};
      }
      case "inference": {
        const mod = await import(
          "@/content/docs/workers/inference/page-mdx-components"
        );
        return mod.pageMdxComponents ?? {};
      }
      case "script": {
        const mod = await import(
          "@/content/docs/workers/script/page-mdx-components"
        );
        return mod.pageMdxComponents ?? {};
      }
      case "poller": {
        const mod = await import(
          "@/content/docs/workers/poller/page-mdx-components"
        );
        return mod.pageMdxComponents ?? {};
      }
      case "model": {
        const mod = await import(
          "@/content/docs/workers/model/page-mdx-components"
        );
        return mod.pageMdxComponents ?? {};
      }
      case "hosted": {
        const mod = await import(
          "@/content/docs/workers/hosted/page-mdx-components"
        );
        return mod.pageMdxComponents ?? {};
      }
      case "mock": {
        const mod = await import(
          "@/content/docs/workers/mock/page-mdx-components"
        );
        return mod.pageMdxComponents ?? {};
      }
      default:
        return {};
    }
  }

  return {};
}

/**
 * Loads a local-message page under a direct route family.
 *
 * `slug` may be nested (`agent/variant`). Uses {@link getDocsPageDir} so nested
 * child bundles resolve the same way discovery and content-path helpers do.
 */
export async function loadRouteFamilyLocalDocsPageFromDisk(
  section: RouteFamilyLocalDocsSection,
  slug: string,
  locale: SiteLocale = defaultLocale,
  docsRoot = getDocsRoot(),
): Promise<LoadedRouteFamilyLocalDocsPage> {
  const pageDir = getDocsPageDir(section, slug, docsRoot);
  const mdxPath = join(pageDir, "page.mdx");
  const assetsPath = join(pageDir, "assets.json");
  const route = buildLocalizedRoute(
    { surface: "docs-page", slug: `${section}/${slug}` },
    locale,
  );

  const source = readFileSync(mdxPath, "utf8");
  const messages = await loadPageMessages(pageDir, locale, { route });
  const assets = parsePageAssetConfig(readJsonFile(assetsPath));
  // Always sync against the live content root so temp docsRoot fixtures do not
  // attempt to read a missing registry/graphs tree beside the fixture.
  syncGraphRegistryForContentRoot(getContentRoot());
  const pageMdxComponents = await loadRouteFamilyPageMdxComponents(
    section,
    slug,
  );

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
