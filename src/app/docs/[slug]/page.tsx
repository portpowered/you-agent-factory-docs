import { DocsShell } from "@/components/docs/docs-shell";
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
    <DocsShell currentPath={page.record.routePath} navigation={navigation}>
      <article aria-labelledby="doc-page-title">
        <h1 id="doc-page-title">{page.title}</h1>
        <div className="docs-page__body">{page.body}</div>
      </article>
    </DocsShell>
  );
}
