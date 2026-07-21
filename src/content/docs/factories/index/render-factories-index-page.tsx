/**
 * Factories-family index composition for /docs/factories.
 *
 * Owned by the factories lane: isolation-first overview, live root Factory
 * summary embed (W07), exhaustive schema/API links, and the child-page list.
 * Does not edit shared nav/search/sitemap/compat inventories.
 */

import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import Link from "next/link";
import { DocsIndexEmptyState } from "@/features/docs/components/DocsIndexEmptyState";
import { DocsIndexEntryList } from "@/features/docs/components/DocsIndexEntryList";
import { FamilyDocsFooterNeighbors } from "@/features/docs/components/FamilyDocsFooterNeighbors";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { resolveFamilyDocsFooterNeighborsForSlug } from "@/lib/content/resolve-family-docs-footer";
import { loadUiMessages } from "@/lib/content/ui-messages";
import type { FactoriesIndexMessages } from "@/lib/content/ui-messages.types";
import { toDocsIndexEntries } from "@/lib/docs/docs-index-entries";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import { FactoryRootSummaryEmbed } from "./FactoryRootSummaryEmbed";

const FACTORIES_CHILD_PREFERRED_SLUGS = [
  "factories/configuration",
  "factories/global-configuration",
  "factories/packaged",
  "factories/dynamic-workflows",
  "factories/sessions",
] as const;

function FactoriesIndexOverview({
  messages,
}: {
  messages: FactoriesIndexMessages;
}) {
  return (
    <section
      id="overview"
      className="mt-6 scroll-mt-6"
      data-factories-index-overview=""
      aria-labelledby="factories-index-overview-heading"
    >
      <h2
        id="factories-index-overview-heading"
        className="font-serif text-2xl font-semibold text-foreground"
      >
        {messages.overviewTitle}
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {messages.overviewBody}
      </p>
    </section>
  );
}

function FactoriesIndexSchemaSummary({
  messages,
}: {
  messages: FactoriesIndexMessages;
}) {
  return (
    <section
      id="factory-root-summary"
      className="mt-10 scroll-mt-6"
      data-factories-index-schema-summary=""
      aria-labelledby="factories-index-schema-summary-heading"
    >
      <h2
        id="factories-index-schema-summary-heading"
        className="font-serif text-2xl font-semibold text-foreground"
      >
        {messages.schemaSummaryTitle}
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {messages.schemaSummaryBody}
      </p>
      <div className="mt-4">
        <FactoryRootSummaryEmbed />
      </div>
      <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <Link
          href="/docs/references/schema"
          className="font-medium text-secondary underline-offset-4 decoration-secondary hover:underline"
          data-factories-index-full-schema-link=""
        >
          {messages.fullFactorySchemaLink}
        </Link>
        <Link
          href="/docs/references/api"
          className="font-medium text-secondary underline-offset-4 decoration-secondary hover:underline"
          data-factories-index-full-api-link=""
        >
          {messages.fullFactoryApiLink}
        </Link>
      </p>
    </section>
  );
}

export async function renderFactoriesIndexPage(
  locale: SiteLocale = defaultLocale,
) {
  const messages = await loadUiMessages(locale);
  const indexMessages = messages.factoriesIndex;
  const pages = await loadShippedLocalizedDocsPages(locale);
  const entries = toDocsIndexEntries(
    pages.filter((page) => page.docsSlug.startsWith("factories/")),
    locale,
    [...FACTORIES_CHILD_PREFERRED_SLUGS],
    Number.POSITIVE_INFINITY,
  );
  const familyNeighbors = await resolveFamilyDocsFooterNeighborsForSlug(
    "factories",
    locale,
  );

  return (
    <DocsPage breadcrumb={{ enabled: false }} footer={{ enabled: false }}>
      <DocsTitle>{indexMessages.title}</DocsTitle>
      <DocsDescription>{indexMessages.description}</DocsDescription>
      <DocsBody>
        <FactoriesIndexOverview messages={indexMessages} />
        <FactoriesIndexSchemaSummary messages={indexMessages} />
        {entries.length === 0 ? (
          <DocsIndexEmptyState
            title={indexMessages.emptyTitle}
            description={indexMessages.emptyDescription}
            homeLinkLabel={indexMessages.emptyHomeLink}
            messages={messages}
            locale={locale}
            includeBlogLink
          />
        ) : (
          <DocsIndexEntryList
            entries={entries}
            listLabel={indexMessages.listLabel}
          />
        )}
        {familyNeighbors ? (
          <FamilyDocsFooterNeighbors neighbors={familyNeighbors} />
        ) : null}
      </DocsBody>
    </DocsPage>
  );
}
