import { DocPageArticle } from "@/components/docs/doc-page-article";
import { DocsRouteChrome } from "@/components/docs/docs-route-chrome";
import { FumadocsDocsLayout } from "@/components/docs/fumadocs-docs-layout";
import {
  listPublishedContentSlugs,
  loadDocsShellNavigation,
  loadPublicContentPage,
} from "@/lib/content";
import { notFound } from "next/navigation";

type GlossaryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublishedContentSlugs("glossary").map((slug) => ({ slug }));
}

export default async function GlossaryPage({ params }: GlossaryPageProps) {
  const { slug } = await params;
  const navigation = loadDocsShellNavigation();

  let page: ReturnType<typeof loadPublicContentPage>;
  try {
    page = loadPublicContentPage("glossary", slug);
  } catch {
    notFound();
  }

  return (
    <FumadocsDocsLayout>
      <DocsRouteChrome
        breadcrumbItems={[
          { labelKey: "docs.glossarySectionLabel" },
          { label: page.title },
        ]}
        currentPath={page.record.routePath}
        hideProgression
        navigation={navigation}
      >
        <DocPageArticle body={page.body} title={page.title} />
      </DocsRouteChrome>
    </FumadocsDocsLayout>
  );
}
