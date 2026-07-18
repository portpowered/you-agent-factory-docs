import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { loadWorkersFamilyIndexBundle } from "./load-workers-family-index";
import { WorkersFamilyIndexContent } from "./WorkersFamilyIndexContent";

/**
 * Renders the authored `/docs/workers` family index (overview, selection,
 * shared fields, and live Worker schema embed).
 */
export async function renderWorkersFamilyIndexPage(
  locale: SiteLocale = defaultLocale,
) {
  const bundle = await loadWorkersFamilyIndexBundle(locale);

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
          <WorkersFamilyIndexContent />
        </DocsBody>
      </DocsPageProviders>
    </DocsPage>
  );
}
