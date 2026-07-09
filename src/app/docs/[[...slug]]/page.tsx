import type { Metadata } from "next";
import { ensureStaticExportParams } from "@/lib/build/static-export";
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
  return ensureStaticExportParams(source.generateParams(), {
    slug: STATIC_EXPORT_EMPTY_DOCS_SLUG,
  });
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
