import { DocPageArticle } from "@/components/docs/doc-page-article";
import { DocsRouteChrome } from "@/components/docs/docs-route-chrome";
import { loadDocPage, loadDocsShellNavigation } from "@/lib/content";
import { notFound } from "next/navigation";

import { listPublishedDocSlugs } from "@/lib/content/load-doc-page";

type DocPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublishedDocSlugs().map((slug) => ({ slug }));
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const navigation = loadDocsShellNavigation();

  let page: ReturnType<typeof loadDocPage>;
  try {
    page = loadDocPage(slug);
  } catch {
    notFound();
  }

  return (
    <DocsRouteChrome
      currentPath={page.record.routePath}
      navigation={navigation}
    >
      <DocPageArticle body={page.body} title={page.title} />
    </DocsRouteChrome>
  );
}
