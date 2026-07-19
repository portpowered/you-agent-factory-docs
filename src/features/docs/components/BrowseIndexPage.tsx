import Link from "next/link";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import type { BrowseCollectionSection } from "@/lib/docs/browse-collection-sections";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import type { ContentColumnConsumerSurface } from "@/lib/layout/content-column-alignment";
import { DocsIndexEntryList } from "./DocsIndexEntryList";
import {
  bulletlessListClassName,
  docsResourceCardLinkClassName,
} from "./list-decoration";

/**
 * /browse header (DocsTitle) + body consume the shared content-column left edge
 * via DocsPage `#nd-page` inset. Wire this surface on the DocsPage container —
 * do not nest another horizontal inset on the body, and keep card lists on
 * `bulletlessListClassName` (`ps-0`) so prose list padding does not drift cards.
 */
export const BROWSE_INDEX_CONTENT_COLUMN_SURFACE =
  "browse-index" as const satisfies ContentColumnConsumerSurface;

type BrowseIndexPageProps = {
  messages: UiMessages;
  locale?: SiteLocale;
  sections: BrowseCollectionSection[];
};

type BrowseRouteCard = {
  href: string;
  title: string;
  description: string;
};

function BrowseRouteCardList({
  cards,
  label,
}: {
  cards: BrowseRouteCard[];
  label: string;
}) {
  return (
    <ul className={bulletlessListClassName("mt-4")} aria-label={label}>
      {cards.map((card) => (
        <li key={card.href}>
          <Link href={card.href} className={docsResourceCardLinkClassName}>
            <span className="font-medium text-foreground">{card.title}</span>
            <p className="mt-1 text-sm text-muted-foreground">
              {card.description}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BrowseSection({
  id,
  title,
  description,
  entries,
  linkLabel,
  linkHref,
}: BrowseCollectionSection) {
  return (
    <section
      id={id}
      className="mt-10 scroll-mt-6"
      aria-labelledby={`${id}-heading`}
    >
      <h2
        id={`${id}-heading`}
        className="font-serif text-2xl font-semibold text-foreground"
      >
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      <DocsIndexEntryList entries={entries} listLabel={title} />
      {linkHref && linkLabel ? (
        <p className="mt-4">
          <Link
            href={linkHref}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {linkLabel}
          </Link>
        </p>
      ) : null}
    </section>
  );
}

export function BrowseCollectionSectionList({
  sections,
}: {
  sections: BrowseCollectionSection[];
}) {
  return (
    <>
      {sections.map((section) => (
        <BrowseSection key={section.id} {...section} />
      ))}
    </>
  );
}

export function BrowseIndexPage({
  messages,
  locale = defaultLocale,
  sections,
}: BrowseIndexPageProps) {
  const { browseIndex, searchEntry, architectureIndex, tagsIndex } = messages;
  const quickRoutes: BrowseRouteCard[] = [
    {
      href: buildLocalizedRoute({ surface: "search" }, locale),
      title: searchEntry.title,
      description: browseIndex.searchRouteDescription,
    },
    {
      href: buildLocalizedRoute({ surface: "architecture-index" }, locale),
      title: architectureIndex.title,
      description: browseIndex.architectureRouteDescription,
    },
    {
      href: buildLocalizedRoute({ surface: "tags-index" }, locale),
      title: tagsIndex.title,
      description: browseIndex.tagsRouteDescription,
    },
  ];

  return (
    <>
      <section
        id="quick-routes"
        className="scroll-mt-6"
        aria-labelledby="browse-quick-routes-heading"
      >
        <h2
          id="browse-quick-routes-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          {browseIndex.quickRoutesTitle}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {browseIndex.quickRoutesDescription}
        </p>
        <BrowseRouteCardList
          cards={quickRoutes}
          label={browseIndex.quickRoutesTitle}
        />
      </section>

      {sections.map((section) => (
        <BrowseSection key={section.id} {...section} />
      ))}
    </>
  );
}
