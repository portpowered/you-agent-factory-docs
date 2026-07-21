import type { Metadata } from "next";
import { loadWorkstationsFamilyIndexBundle } from "@/content/docs/workstations/load-workstations-family-index";
import { renderWorkstationsFamilyIndexPage } from "@/content/docs/workstations/render-workstations-family-index";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadWorkstationsFamilyIndexBundle();

  return {
    title: bundle.messages.title,
    description: bundle.messages.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "workstations",
    }),
  };
}

export default async function WorkstationsIndexPage() {
  return renderWorkstationsFamilyIndexPage();
}
