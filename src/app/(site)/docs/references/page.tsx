import type { Metadata } from "next";
import { loadReferencesFamilyIndex } from "@/content/docs/references/family-index/load-references-family-index";
import { localizedShippedDocsPageAlternates } from "@/lib/i18n/route-locale";
import { renderReferencesFamilyIndexPage } from "../../site-renderers";

export async function generateMetadata(): Promise<Metadata> {
  const index = await loadReferencesFamilyIndex();

  return {
    title: index.messages.title,
    description: index.messages.description,
    alternates: localizedShippedDocsPageAlternates("references"),
  };
}

export default async function ReferencesIndexPage() {
  return renderReferencesFamilyIndexPage();
}
