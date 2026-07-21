import type { Metadata } from "next";
import { renderSectionCollectionIndexPage } from "@/app/(site)/site-renderers";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { resolveMetadataLocale } from "../../../localized-shell-metadata";

type LocalizedDocumentationIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalizedDocumentationIndexPageProps): Promise<Metadata> {
  const locale = await resolveMetadataLocale(params);
  const messages = await loadUiMessages(locale);

  return {
    title: messages.documentationIndex.title,
    description: messages.documentationIndex.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "documentation",
    }),
  };
}

export default async function LocalizedDocumentationIndexPage({
  params,
}: LocalizedDocumentationIndexPageProps) {
  const locale = await resolveMetadataLocale(params);
  return renderSectionCollectionIndexPage("documentation", locale);
}
