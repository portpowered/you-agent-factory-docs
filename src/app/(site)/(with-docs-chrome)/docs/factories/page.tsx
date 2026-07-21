import type { Metadata } from "next";
import { renderFactoriesIndexPage } from "@/content/docs/factories/index/render-factories-index-page";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadUiMessages();

  return {
    title: messages.factoriesIndex.title,
    description: messages.factoriesIndex.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "factories",
    }),
  };
}

export default async function FactoriesIndexPage() {
  return renderFactoriesIndexPage();
}
