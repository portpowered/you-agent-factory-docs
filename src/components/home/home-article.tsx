import {
  HomeBrowseLink,
  HomeBrowseList,
} from "@/components/home/home-browse-link";
import { HomeBrushHeader } from "@/components/home/home-brush-header";
import { HomeCommandBlock } from "@/components/home/home-command-block";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import { defaultLocale, type SiteLocale } from "@/lib/i18n/locale-routing";
import type { SiteConfig } from "@/lib/site/site-config.contract";
import { resolveSiteConfigHomeFeaturedLinks } from "@/lib/site/site-config-resolution";

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

  return (
    <article className="max-w-3xl">
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
