import type { Metadata } from "next";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizedRouteAlternates } from "@/lib/i18n/route-locale";
import { withPageOpenGraph } from "@/lib/seo/page-open-graph";
import { renderHomePage } from "./site-renderers";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadUiMessages();

  return withPageOpenGraph({
    title: messages.home.title,
    description: messages.home.intro,
    alternates: localizedRouteAlternates({ surface: "home" }),
  });
}

export default async function HomePage() {
  return renderHomePage();
}
