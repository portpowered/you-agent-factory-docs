import type { Metadata } from "next";
import { renderSectionCollectionIndexPage } from "@/app/(site)/site-renderers";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { resolveMetadataLocale } from "../../localized-shell-metadata";

type LocalizedFactoriesIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalizedFactoriesIndexPageProps): Promise<Metadata> {
  const locale = await resolveMetadataLocale(params);
  const messages = await loadUiMessages(locale);

  return {
    title: messages.factoriesIndex.title,
    description: messages.factoriesIndex.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "factories",
    }),
  };
}

export default async function LocalizedFactoriesIndexPage({
  params,
}: LocalizedFactoriesIndexPageProps) {
  const locale = await resolveMetadataLocale(params);
  return renderSectionCollectionIndexPage("factories", locale);
}
