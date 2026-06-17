import { DocPageArticle } from "@/components/docs/doc-page-article";
import { DocsShell } from "@/components/docs/docs-shell";
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
    <DocsShell
      breadcrumbItems={[{ label: "Terms" }, { label: page.title }]}
      currentPath={page.record.routePath}
      hideProgression
      navigation={navigation}
    >
      <DocPageArticle body={page.body} title={page.title} />
    </DocsShell>
  );
}
