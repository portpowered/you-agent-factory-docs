import type { Metadata } from "next";
import { renderReferencesFamilyIndexPage } from "@/app/(site)/site-renderers";
import { loadReferencesFamilyIndex } from "@/content/docs/references/family-index/load-references-family-index";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { resolveMetadataLocale } from "../../localized-shell-metadata";

type LocalizedReferencesIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalizedReferencesIndexPageProps): Promise<Metadata> {
  const locale = await resolveMetadataLocale(params);
  const index = await loadReferencesFamilyIndex(locale);

  return {
    title: index.messages.title,
    description: index.messages.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "references",
    }),
  };
}

export default async function LocalizedReferencesIndexPage({
  params,
}: LocalizedReferencesIndexPageProps) {
  const locale = await resolveMetadataLocale(params);
  return renderReferencesFamilyIndexPage(locale);
}
