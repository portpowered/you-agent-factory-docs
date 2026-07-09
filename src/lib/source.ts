import { loader } from "fumadocs-core/source";
import { excludeNonPublishedLocalDocsPlugin } from "@/lib/content/exclude-non-published-local-docs-plugin";
import { isAcceptedDocsSourceSection } from "@/lib/docs/docs-collection-slug-acceptance";
import { loadGeneratedDocsSourceBinding } from "@/lib/fumadocs-source-runtime";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";

const { docs } = await loadGeneratedDocsSourceBinding();

/** Maps local docs page bundles to reader URLs. */
function pageBundleSlug(file: { path: string }): string[] | undefined {
  if (!file.path.endsWith("/page.mdx")) {
    return undefined;
  }

  const sectionSlugs = file.path
    .slice(0, -"/page.mdx".length)
    .split("/")
    .filter(Boolean);

  const section = sectionSlugs[0];
  if (section !== undefined && isAcceptedDocsSourceSection(section)) {
    return sectionSlugs;
  }

  return undefined;
}

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource() as Parameters<typeof loader>[0]["source"],
  slugs: pageBundleSlug,
  plugins: [excludeNonPublishedLocalDocsPlugin()],
});

source.pageTree = buildGeneratedDocsPageTree(source.pageTree);
