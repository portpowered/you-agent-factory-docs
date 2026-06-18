import { DocPageArticle } from "@/components/docs/doc-page-article";
import { DocsRouteChrome } from "@/components/docs/docs-route-chrome";
import {
  buildContentPageMetadata,
  loadDocPage,
  loadDocsShellNavigation,
} from "@/lib/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listPublishedDocSlugs } from "@/lib/content/load-doc-page";

type DocPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublishedDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = loadDocPage(slug);

  return buildContentPageMetadata({
    title: page.title,
    body: page.body,
    routePath: page.record.routePath,
  });
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
