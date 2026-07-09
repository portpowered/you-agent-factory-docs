import type { Metadata } from "next";
import { renderSectionCollectionIndexPage } from "@/app/(site)/site-renderers";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { resolveMetadataLocale } from "../../localized-shell-metadata";

type LocalizedTechniquesIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalizedTechniquesIndexPageProps): Promise<Metadata> {
  const locale = await resolveMetadataLocale(params);
  const messages = await loadUiMessages(locale);

  return {
    title: messages.techniquesIndex.title,
    description: messages.techniquesIndex.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "techniques",
    }),
  };
}

export default async function LocalizedTechniquesIndexPage({
  params,
}: LocalizedTechniquesIndexPageProps) {
  const locale = await resolveMetadataLocale(params);
  return renderSectionCollectionIndexPage("techniques", locale);
}
