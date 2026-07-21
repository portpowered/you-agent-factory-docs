import type { Metadata } from "next";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { withPageOpenGraph } from "@/lib/seo/page-open-graph";
import { renderSearchPage, type SearchPageProps } from "../../site-renderers";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadUiMessages();

  return withPageOpenGraph({
    title: messages.searchEntry.title,
    description: messages.searchEntry.description,
    alternates: localizedRouteAlternates({ surface: "search" }),
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  return renderSearchPage(undefined, { searchParams });
}
