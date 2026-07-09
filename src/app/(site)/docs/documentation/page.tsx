import type { Metadata } from "next";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { renderSectionCollectionIndexPage } from "../../site-renderers";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadUiMessages();

  return {
    title: messages.documentationIndex.title,
    description: messages.documentationIndex.description,
    alternates: localizedRouteAlternates({
      surface: "docs-page",
      slug: "documentation",
    }),
  };
}

export default async function DocumentationIndexPage() {
  return renderSectionCollectionIndexPage("documentation");
}
