import {
  HomeBrowseLink,
  HomeBrowseList,
} from "@/components/home/home-browse-link";
import { HomeBrushHeader } from "@/components/home/home-brush-header";
import { HomeCommandBlock } from "@/components/home/home-command-block";
import { bulletlessListClassName } from "@/features/docs/components/list-decoration";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import type { ContentColumnConsumerSurface } from "@/lib/layout/content-column-alignment";
import type { SiteConfig } from "@/lib/site/site-config.contract";
import { resolveSiteConfigHomeFeaturedLinks } from "@/lib/site/site-config-resolution";

/**
 * Home article + Browse consume the shared content-column left edge via the
 * surrounding DocsPage `#nd-page` inset (`CONTENT_COLUMN_INSET_CLASS`). Do not
 * nest another horizontal inset here — that would double-pad the column.
 */
export const HOME_ARTICLE_CONTENT_COLUMN_SURFACE =
  "home-article-browse" as const satisfies ContentColumnConsumerSurface;

/**
 * Article width only. Horizontal inset comes from DocsPage; keep this free of
 * `px-*` / negative-margin compensation so body text and Browse share one edge.
 */
export const HOME_ARTICLE_CLASS = "max-w-3xl";

type HomeArticleProps = {
  messages: UiMessages;
  siteConfig: SiteConfig;
  locale?: SiteLocale;
};

export function HomeArticle({
  messages,
  siteConfig,
  locale = defaultLocale,
}: HomeArticleProps) {
  const { home } = messages;
  const featuredLinks = resolveSiteConfigHomeFeaturedLinks(
    siteConfig,
    messages,
    locale,
  );
  const featureItems = [
    home.featureHarnesses,
    home.featureLoop,
    home.featureReview,
    home.featurePlanner,
    home.featureCrons,
    home.featureEventStreams,
  ] as const;

  return (
    <article
      className={HOME_ARTICLE_CLASS}
      data-content-column-surface={HOME_ARTICLE_CONTENT_COLUMN_SURFACE}
    >
      <HomeBrushHeader title={home.title} subtitle={home.subtitle} />

      <section
        id="install"
        className="mt-8 scroll-mt-6"
        aria-labelledby="home-install-heading"
      >
        <h2
          id="home-install-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          {home.installSectionTitle}
        </h2>
        <HomeCommandBlock
          label={home.installMacosLinuxLabel}
          command={home.installMacosLinuxCommand}
        />
        <HomeCommandBlock
          label={home.installWindowsLabel}
          command={home.installWindowsCommand}
        />
      </section>

      <section
        id="run"
        className="mt-8 scroll-mt-6"
        aria-labelledby="home-run-heading"
      >
        <h2
          id="home-run-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          {home.runSectionTitle}
        </h2>
        <HomeCommandBlock
          label={home.runCommandLabel}
          command={home.runCommand}
        />
      </section>

      <section
        id="why"
        className="mt-8 scroll-mt-6"
        aria-labelledby="home-why-heading"
      >
        <h2
          id="home-why-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          {home.whySectionTitle}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {home.whyBody}
        </p>
      </section>

      <section
        id="features"
        className="mt-8 scroll-mt-6"
        aria-labelledby="home-features-heading"
      >
        <h2
          id="home-features-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          {home.featuresSectionTitle}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {home.featuresIntro}
        </p>
        <ul
          className={bulletlessListClassName("mt-4")}
          aria-label={home.featuresSectionTitle}
        >
          {featureItems.map((item) => (
            <li key={item} className="text-base text-foreground">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section
        id="browse"
        className="mt-8 scroll-mt-6"
        aria-labelledby="home-browse-heading"
      >
        <h2
          id="home-browse-heading"
          className="font-serif text-2xl font-semibold text-foreground"
        >
          {home.browseSectionTitle}
        </h2>
        <HomeBrowseList ariaLabel={home.browseSectionTitle}>
          {featuredLinks.map((link) => (
            <HomeBrowseLink
              key={link.href}
              href={link.href}
              title={link.title}
              description={link.description}
            />
          ))}
        </HomeBrowseList>
      </section>
    </article>
  );
}
