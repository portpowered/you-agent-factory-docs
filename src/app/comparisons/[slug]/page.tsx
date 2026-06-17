import { DocPageArticle } from "@/components/docs/doc-page-article";
import { DocsShell } from "@/components/docs/docs-shell";
import {
  listPublishedContentSlugs,
  loadDocsShellNavigation,
  loadPublicContentPage,
} from "@/lib/content";
import { notFound } from "next/navigation";

type ComparisonPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublishedContentSlugs("comparison").map((slug) => ({ slug }));
}

export default async function ComparisonPage({ params }: ComparisonPageProps) {
  const { slug } = await params;
  const navigation = loadDocsShellNavigation();

  let page: ReturnType<typeof loadPublicContentPage>;
  try {
    page = loadPublicContentPage("comparison", slug);
  } catch {
    notFound();
  }

  return (
    <DocsShell
      breadcrumbItems={[{ label: "Comparisons" }, { label: page.title }]}
      currentPath={page.record.routePath}
      hideProgression
      navigation={navigation}
    >
      <DocPageArticle body={page.body} title={page.title} />
    </DocsShell>
  );
}
