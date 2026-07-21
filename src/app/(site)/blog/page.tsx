import type { Metadata } from "next";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { englishOnlyCanonicalAlternates } from "@/lib/i18n/route-locale";
import { renderBlogIndexPage } from "../site-renderers";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadUiMessages();

  return {
    title: messages.blogIndex.title,
    description: messages.blogIndex.description,
    // English-only until blog locales ship — no false ja/zh-CN/vi hreflang.
    alternates: englishOnlyCanonicalAlternates({ surface: "blog-index" }),
  };
}

export default async function BlogIndexPage() {
  return renderBlogIndexPage();
}
