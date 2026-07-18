import type { Metadata } from "next";
import { loadWorkersFamilyIndexBundle } from "@/content/docs/workers/load-workers-family-index";
import { renderWorkersFamilyIndexPage } from "@/content/docs/workers/render-workers-family-index";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadWorkersFamilyIndexBundle();

  return {
    title: bundle.messages.title,
    description: bundle.messages.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "workers",
    }),
  };
}

export default async function WorkersIndexPage() {
  return renderWorkersFamilyIndexPage();
}
