import type { Metadata } from "next";
import { renderSectionCollectionIndexPage } from "@/app/(site)/site-renderers";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { resolveMetadataLocale } from "../../localized-shell-metadata";

type LocalizedWorkstationsIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalizedWorkstationsIndexPageProps): Promise<Metadata> {
  const locale = await resolveMetadataLocale(params);
  const messages = await loadUiMessages(locale);

  return {
    title: messages.workstationsIndex.title,
    description: messages.workstationsIndex.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "workstations",
    }),
  };
}

export default async function LocalizedWorkstationsIndexPage({
  params,
}: LocalizedWorkstationsIndexPageProps) {
  const locale = await resolveMetadataLocale(params);
  return renderSectionCollectionIndexPage("workstations", locale);
}
