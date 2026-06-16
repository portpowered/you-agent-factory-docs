import { DocPageArticle } from "@/components/docs/doc-page-article";
import { DocsShell } from "@/components/docs/docs-shell";
import { loadDocPage, loadDocsShellNavigation } from "@/lib/content";
import { notFound } from "next/navigation";

import { listPublishedDocSlugs } from "@/lib/content/load-doc-page";
import { enMessages } from "@/localization/messages/en";

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
      <DocPageArticle
        body={page.body}
        onThisPageLabel={enMessages.docs.onThisPageLabel}
        outlineAriaLabel={enMessages.docs.pageOutlineAriaLabel}
        title={page.title}
      />
    </DocsShell>
  );
}
