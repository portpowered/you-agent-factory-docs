import type { Metadata } from "next";
import { ensureStaticExportParams } from "@/lib/build/static-export";
import { omitRetiredAtlasDocsStaticParams } from "@/lib/build/static-export-legacy-compile-graph";
import { source } from "@/lib/source";
import {
  buildDocsPageMetadata,
  renderDocsSlugPage,
} from "../docs-slug-renderer";

type DocsPageProps = {
  params: Promise<{ slug?: string[] }>;
};

/** Placeholder slug when no docs pages remain (static export requires ≥1 param). */
const STATIC_EXPORT_EMPTY_DOCS_SLUG = ["__no_docs_pages__"];

export function generateStaticParams() {
  return ensureStaticExportParams(
    omitRetiredAtlasDocsStaticParams(source.generateParams()),
    {
      slug: STATIC_EXPORT_EMPTY_DOCS_SLUG,
      lang: "en",
    },
  );
}

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildDocsPageMetadata(slug);
}

export default async function DocsSlugPage({ params }: DocsPageProps) {
  const { slug } = await params;
  return renderDocsSlugPage(slug);
}
