import type { Metadata } from "next";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { renderSectionCollectionIndexPage } from "../../site-renderers";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadUiMessages();

  return {
    title: messages.referencesIndex.title,
    description: messages.referencesIndex.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "references",
    }),
  };
}

export default async function ReferencesIndexPage() {
  return renderSectionCollectionIndexPage("references");
}
