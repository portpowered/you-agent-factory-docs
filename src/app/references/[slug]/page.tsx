import { PublicContentPageShell } from "@/components/content/public-content-page-shell";
import {
  PublicContentPageNotFoundError,
  buildContentPageMetadata,
  listPublishedPublicContentRouteParams,
  loadPublicContentPage,
} from "@/lib/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type ReferencePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listPublishedPublicContentRouteParams(undefined, {
    supportedKinds: ["reference"],
  }).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ReferencePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = loadPublicContentPage("reference", slug);

  return buildContentPageMetadata({
    title: page.title,
    body: page.body,
    routePath: page.record.routePath,
  });
}

export default async function ReferencePage({ params }: ReferencePageProps) {
  const { slug } = await params;

  try {
    const page = loadPublicContentPage("reference", slug);

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
