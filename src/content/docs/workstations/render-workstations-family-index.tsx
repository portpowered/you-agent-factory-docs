import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { FamilyDocsFooterNeighbors } from "@/features/docs/components/FamilyDocsFooterNeighbors";
import { resolveFamilyDocsFooterNeighborsForSlug } from "@/lib/content/resolve-family-docs-footer";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { loadWorkstationsFamilyIndexBundle } from "./load-workstations-family-index";
import { WorkstationsFamilyIndexContent } from "./WorkstationsFamilyIndexContent";

/**
 * Renders the authored `/docs/workstations` family index (overview, selection,
 * compatibility matrix, shared fields, and live Workstation schema embed).
 */
export async function renderWorkstationsFamilyIndexPage(
  locale: SiteLocale = defaultLocale,
) {
  const bundle = await loadWorkstationsFamilyIndexBundle(locale);
  const familyNeighbors = await resolveFamilyDocsFooterNeighborsForSlug(
    "workstations",
    locale,
  );

  return (
    <DocsPage breadcrumb={{ enabled: false }} footer={{ enabled: false }}>
      <DocsPageProviders
        messages={bundle.messages}
        assets={bundle.assets}
        locale={locale}
      >
        <DocsTitle>{bundle.messages.title}</DocsTitle>
        <DocsDescription>{bundle.messages.description}</DocsDescription>
        <DocsBody>
          {bundle.messages.openingSummary ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {bundle.messages.openingSummary}
            </p>
          ) : null}
          <WorkstationsFamilyIndexContent />
          {familyNeighbors ? (
            <FamilyDocsFooterNeighbors neighbors={familyNeighbors} />
          ) : null}
        </DocsBody>
      </DocsPageProviders>
    </DocsPage>
  );
}
