import type { Metadata } from "next";
import { loadWorkersFamilyIndexBundle } from "@/content/docs/workers/load-workers-family-index";
import { renderWorkersFamilyIndexPage } from "@/content/docs/workers/render-workers-family-index";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { resolveMetadataLocale } from "../../localized-shell-metadata";

type LocalizedWorkersIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalizedWorkersIndexPageProps): Promise<Metadata> {
  const locale = await resolveMetadataLocale(params);
  const bundle = await loadWorkersFamilyIndexBundle(locale);

  return {
    title: bundle.messages.title,
    description: bundle.messages.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "workers",
    }),
  };
}

export default async function LocalizedWorkersIndexPage({
  params,
}: LocalizedWorkersIndexPageProps) {
  const locale = await resolveMetadataLocale(params);
  return renderWorkersFamilyIndexPage(locale);
}
