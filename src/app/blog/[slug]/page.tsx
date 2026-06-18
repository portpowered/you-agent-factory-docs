import { PublicContentPageShell } from "@/components/content/public-content-page-shell";
import {
  PublicContentPageNotFoundError,
  buildContentPageMetadata,
  listPublishedPublicContentRouteParams,
  loadPublicContentPage,
} from "@/lib/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublishedPublicContentRouteParams(undefined, {
    supportedKinds: ["blog"],
  }).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = loadPublicContentPage("blog", slug);

  return buildContentPageMetadata({
    title: page.title,
    body: page.body,
    routePath: page.record.routePath,
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;

  try {
    const page = loadPublicContentPage("blog", slug);

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
