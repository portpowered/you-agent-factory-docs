import { PublicContentPageShell } from "@/components/content/public-content-page-shell";
import {
  PublicContentPageNotFoundError,
  buildContentPageMetadata,
  listPublishedPublicContentRouteParams,
  loadPublicContentPage,
} from "@/lib/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type GlossaryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublishedPublicContentRouteParams(undefined, {
    supportedKinds: ["glossary"],
  }).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GlossaryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = loadPublicContentPage("glossary", slug);

  return buildContentPageMetadata({
    title: page.title,
    body: page.body,
    routePath: page.record.routePath,
  });
}

export default async function GlossaryPage({ params }: GlossaryPageProps) {
  const { slug } = await params;

  try {
    const page = loadPublicContentPage("glossary", slug);

    return (
      <PublicContentPageShell
        body={page.body}
        record={page.record}
        title={page.title}
      />
    );
  } catch (error) {
    if (!(error instanceof PublicContentPageNotFoundError)) {
      throw error;
    }

    notFound();
  }
}
