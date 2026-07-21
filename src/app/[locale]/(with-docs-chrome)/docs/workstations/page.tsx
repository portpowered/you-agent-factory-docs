import type { Metadata } from "next";
import { loadWorkstationsFamilyIndexBundle } from "@/content/docs/workstations/load-workstations-family-index";
import { renderWorkstationsFamilyIndexPage } from "@/content/docs/workstations/render-workstations-family-index";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { resolveMetadataLocale } from "../../../localized-shell-metadata";

type LocalizedWorkstationsIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalizedWorkstationsIndexPageProps): Promise<Metadata> {
  const locale = await resolveMetadataLocale(params);
  const bundle = await loadWorkstationsFamilyIndexBundle(locale);

  return {
    title: bundle.messages.title,
    description: bundle.messages.description,
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
  return renderWorkstationsFamilyIndexPage(locale);
}
