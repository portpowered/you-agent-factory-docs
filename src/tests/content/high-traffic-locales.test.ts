/**
 * Focused high-traffic locale proofs for fill-high-traffic-locales-007.
 *
 * Asserts filled ja / zh-CN / vi reader-facing prose differs from English,
 * shipped-localized-docs membership for the filled install/run journey
 * (including documentation/cli), fail-closed behavior for an intentionally
 * unfilled published page, and that this lane does not claim full-corpus
 * translation.
 */
import { describe, expect, test } from "bun:test";
import { getDocsPageDir } from "@/lib/content/content-paths";
import {
  hasPageMessagesFile,
  loadPageMessages,
  MessageLoadError,
} from "@/lib/content/page-messages-load";
import type { PageMessages } from "@/lib/content/schemas";
import {
  getShippedLocalizedDocsSlugs,
  isShippedLocalizedDocsSlug,
  type NonDefaultLocale,
} from "@/lib/content/shipped-localized-docs";
import { loadUiMessages } from "@/lib/content/ui-messages";

const NON_DEFAULT_LOCALES = [
  "ja",
  "zh-CN",
  "vi",
] as const satisfies readonly NonDefaultLocale[];

const HIGH_TRAFFIC_DOCS_PAGES = [
  { section: "guides", slug: "getting-started" },
  { section: "documentation", slug: "install" },
  { section: "documentation", slug: "what-is-you-agent-factory" },
  { section: "documentation", slug: "cli" },
  { section: "guides", slug: "using-you-agent-factory-for-loops" },
  { section: "guides", slug: "write-review-loops" },
  { section: "guides", slug: "cursor-dynamic-workflows" },
] as const;

const HIGH_TRAFFIC_DOCS_SLUGS = HIGH_TRAFFIC_DOCS_PAGES.map(
  (page) => `${page.section}/${page.slug}`,
);

/** Intentionally unfilled published docs page (en-only messages). */
const UNFILLED_DOCS_SLUG = "documentation/configuration";

/** Shipped non-high-traffic page that still uses English stub locale copy. */
const STUBBED_NON_HIGH_TRAFFIC = {
  section: "concepts" as const,
  slug: "harness",
  docsSlug: "concepts/harness",
};

const HOME_READER_FACING_KEYS = [
  "subtitle",
  "intro",
  "installSectionTitle",
  "runSectionTitle",
  "runCommandLabel",
  "whySectionTitle",
  "whyBody",
  "featuresSectionTitle",
  "featuresIntro",
  "featureHarnesses",
  "featureLoop",
  "featureReview",
  "featurePlanner",
  "featureCrons",
  "featureEventStreams",
  "browseSectionTitle",
  "guidesLinkTitle",
  "guidesLinkDescription",
  "docsLinkTitle",
  "docsLinkDescription",
] as const;

const HOME_COMMAND_LITERAL_KEYS = [
  "installMacosLinuxCommand",
  "installWindowsCommand",
  "runCommand",
] as const;

function collectReaderFacingProse(messages: PageMessages): string[] {
  const values: string[] = [];

  if (messages.title) {
    values.push(messages.title);
  }
  if (messages.description) {
    values.push(messages.description);
  }
  if (messages.openingSummary) {
    values.push(messages.openingSummary);
  }

  if (messages.sections) {
    for (const section of Object.values(messages.sections)) {
      if (section.title) {
        values.push(section.title);
      }
      if (section.body) {
        values.push(section.body);
      }
    }
  }

  if (messages.callouts) {
    for (const callout of Object.values(messages.callouts)) {
      if (callout.title) {
        values.push(callout.title);
      }
      if (callout.body) {
        values.push(callout.body);
      }
    }
  }

  return values.filter((value) => value.trim().length > 0);
}

function assertLocalizedProseDiffers(
  localized: PageMessages,
  english: PageMessages,
  options: { allowIdenticalTitle?: boolean } = {},
) {
  const localizedProse = collectReaderFacingProse(localized);
  const englishProse = collectReaderFacingProse(english);

  expect(localizedProse.length).toBeGreaterThan(0);
  expect(englishProse.length).toBeGreaterThan(0);

  if (!options.allowIdenticalTitle) {
    expect(localized.title).not.toBe(english.title);
  }

  expect(localized.description).not.toBe(english.description);
  if (english.openingSummary) {
    expect(localized.openingSummary).toBeTruthy();
    expect(localized.openingSummary).not.toBe(english.openingSummary);
  }

  const differingCount = localizedProse.filter(
    (value, index) => value !== englishProse[index],
  ).length;
  expect(differingCount).toBeGreaterThan(0);
}

describe("high-traffic locales focused proofs", () => {
  test("home shell reader-facing copy differs from English while command literals stay identical", async () => {
    const en = await loadUiMessages("en");

    for (const locale of NON_DEFAULT_LOCALES) {
      const localized = await loadUiMessages(locale);

      for (const key of HOME_READER_FACING_KEYS) {
        expect(localized.home[key]).toBeTruthy();
        expect(localized.home[key]).not.toBe(en.home[key]);
      }

      expect(localized.home.title).toBe(en.home.title);
      for (const key of HOME_COMMAND_LITERAL_KEYS) {
        expect(localized.home[key]).toBe(en.home[key]);
      }
      expect(localized.home.installMacosLinuxLabel).toBe("macOS / Linux");
      expect(localized.home.installWindowsLabel).toBe("Windows (PowerShell)");
    }
  });

  test(
    "filled high-traffic docs message bundles differ from English for reader-facing prose",
    async () => {
      for (const page of HIGH_TRAFFIC_DOCS_PAGES) {
        const pageDir = getDocsPageDir(page.section, page.slug);
        const docsSlug = `${page.section}/${page.slug}`;
        const en = await loadPageMessages(pageDir, "en", {
          route: `/docs/${docsSlug}`,
        });
        const allowIdenticalTitle = page.slug === "cli";

        for (const locale of NON_DEFAULT_LOCALES) {
          const localized = await loadPageMessages(pageDir, locale, {
            route: `/${locale}/docs/${docsSlug}`,
          });
          assertLocalizedProseDiffers(localized, en, {
            allowIdenticalTitle,
          });
          // Some guide descriptions omit the product name even in English;
          // openingSummary / body still identify you-agent-factory.
          const productSurface = [
            localized.description,
            localized.openingSummary,
            localized.sections?.whatItIs?.body,
            localized.sections?.whatItCovers?.body,
          ]
            .filter((value): value is string => typeof value === "string")
            .join("\n");
          expect(productSurface).toContain("you-agent-factory");
        }
      }
    },
    { timeout: 15_000 },
  );

  test("shipped-localized-docs includes every filled high-traffic docs slug including documentation/cli", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      const shipped = getShippedLocalizedDocsSlugs(locale);

      for (const docsSlug of HIGH_TRAFFIC_DOCS_SLUGS) {
        expect(isShippedLocalizedDocsSlug(docsSlug, locale)).toBe(true);
        expect(shipped).toContain(docsSlug);
      }

      expect(isShippedLocalizedDocsSlug("documentation/cli", locale)).toBe(
        true,
      );
    }
  });

  test("intentionally unfilled published docs stay fail-closed without English page-message fallback", async () => {
    const pageDir = getDocsPageDir("documentation", "configuration");

    expect(hasPageMessagesFile(pageDir, "en")).toBe(true);

    for (const locale of NON_DEFAULT_LOCALES) {
      expect(isShippedLocalizedDocsSlug(UNFILLED_DOCS_SLUG, locale)).toBe(
        false,
      );
      expect(hasPageMessagesFile(pageDir, locale)).toBe(false);

      await expect(
        loadPageMessages(pageDir, locale, {
          route: `/${locale}/docs/${UNFILLED_DOCS_SLUG}`,
        }),
      ).rejects.toBeInstanceOf(MessageLoadError);

      await expect(
        loadPageMessages(pageDir, locale, {
          route: `/${locale}/docs/${UNFILLED_DOCS_SLUG}`,
        }),
      ).rejects.toThrow(/Missing messages file/);
    }
  });

  test("does not claim full-corpus translation outside the high-traffic filled set", async () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      expect(isShippedLocalizedDocsSlug(UNFILLED_DOCS_SLUG, locale)).toBe(
        false,
      );
      expect(
        isShippedLocalizedDocsSlug(STUBBED_NON_HIGH_TRAFFIC.docsSlug, locale),
      ).toBe(true);
    }

    const harnessDir = getDocsPageDir(
      STUBBED_NON_HIGH_TRAFFIC.section,
      STUBBED_NON_HIGH_TRAFFIC.slug,
    );
    const enHarness = await loadPageMessages(harnessDir, "en", {
      route: `/docs/${STUBBED_NON_HIGH_TRAFFIC.docsSlug}`,
    });

    for (const locale of NON_DEFAULT_LOCALES) {
      const localizedHarness = await loadPageMessages(harnessDir, locale, {
        route: `/${locale}/docs/${STUBBED_NON_HIGH_TRAFFIC.docsSlug}`,
      });

      // Outside the high-traffic fill set, shipped stubs may still reuse
      // English wording. That proves this lane did not claim full-corpus
      // translation.
      expect(localizedHarness.title).toBe(enHarness.title);
      expect(localizedHarness.description).toBe(enHarness.description);
      expect(localizedHarness.sections?.whatItIs?.body).toBe(
        enHarness.sections?.whatItIs?.body,
      );
    }
  });
});
