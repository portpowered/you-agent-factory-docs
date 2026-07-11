"use client";

import Link from "next/link";
import { SearchTrigger } from "@/features/docs/search/SearchTrigger";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";

const recoveryLinkClassName =
  "inline-flex items-center rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-ring hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type DocsIndexEmptyStateProps = {
  title: string;
  description: string;
  homeLinkLabel: string;
  messages: UiMessages;
  locale?: SiteLocale;
  /**
   * When true, include a Blog recovery link. Omit on the blog index itself so
   * readers are not offered a self-link to the empty surface.
   */
  includeBlogLink?: boolean;
};

export function DocsIndexEmptyState({
  title,
  description,
  homeLinkLabel,
  messages,
  locale = defaultLocale,
  includeBlogLink = false,
}: DocsIndexEmptyStateProps) {
  return (
    <output className="mt-8 block rounded-lg border border-border bg-card/40 p-6">
      <h2 className="font-serif text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={buildLocalizedRoute({ surface: "home" }, locale)}
          className={recoveryLinkClassName}
        >
          {homeLinkLabel}
        </Link>
        <Link
          href={buildLocalizedRoute({ surface: "browse" }, locale)}
          className={recoveryLinkClassName}
        >
          {messages.browseIndex.title}
        </Link>
        {includeBlogLink ? (
          <Link
            href={buildLocalizedRoute({ surface: "blog-index" }, locale)}
            className={recoveryLinkClassName}
          >
            {messages.nav.blog}
          </Link>
        ) : null}
        <SearchTrigger messages={messages} />
      </div>
    </output>
  );
}
