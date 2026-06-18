import { DocPageArticle } from "@/components/docs/doc-page-article";
import { DocsRouteChrome } from "@/components/docs/docs-route-chrome";
import { FumadocsDocsLayout } from "@/components/docs/fumadocs-docs-layout";
import {
  listPublishedContentSlugs,
  loadDocsShellNavigation,
  loadPublicContentPage,
} from "@/lib/content";
import { notFound } from "next/navigation";

type ReferencePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublishedContentSlugs("reference").map((slug) => ({ slug }));
}

export default async function ReferencePage({ params }: ReferencePageProps) {
  const { slug } = await params;
  const navigation = loadDocsShellNavigation();

  let page: ReturnType<typeof loadPublicContentPage>;
  try {
    page = loadPublicContentPage("reference", slug);
  } catch {
    notFound();
  }

  return (
    <FumadocsDocsLayout>
      <DocsRouteChrome
        breadcrumbItems={[
          { labelKey: "docs.referenceSectionLabel" },
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
