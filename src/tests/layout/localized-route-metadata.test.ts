import { describe, expect, it, setDefaultTimeout } from "bun:test";
import { generateMetadata as generateHomeMetadata } from "@/app/(site)/page";
import { generateMetadata as generateSearchMetadata } from "@/app/(site)/search/page";
import { generateMetadata as generateTagMetadata } from "@/app/(site)/tags/[slug]/page";
import {
  generateMetadata as generateLocalizedDocsMetadata,
  generateStaticParams as generateLocalizedDocsStaticParams,
} from "@/app/[locale]/docs/[[...slug]]/page";
import { generateMetadata as generateLocalizedArchitectureMetadata } from "@/app/[locale]/docs/architecture/page";
import { generateMetadata as generateLocalizedGlossaryMetadata } from "@/app/[locale]/docs/glossary/page";
import { generateMetadata as generateLocalizedHomeMetadata } from "@/app/[locale]/page";
import { generateMetadata as generateLocalizedSearchMetadata } from "@/app/[locale]/search/page";
import { generateMetadata as generateLocalizedTagsMetadata } from "@/app/[locale]/tags/page";
import { generateMetadata as generateDocsMetadata } from "@/app/docs/[[...slug]]/page";

setDefaultTimeout(15_000);

describe("localized route metadata alternates", () => {
  it("publishes alternate-language metadata for the home and search surfaces", async () => {
    const homeMetadata = await generateHomeMetadata();
    const searchMetadata = await generateSearchMetadata();

    expect(homeMetadata.title).toBe("You Agent Factory");
    expect(homeMetadata.description).toContain("you-agent-factory");
    expect(String(homeMetadata.title)).not.toMatch(/Model Atlas/i);
    expect(String(homeMetadata.description)).not.toMatch(/Model Atlas/i);

    expect(homeMetadata.alternates?.canonical).toBe("/");
    expect(homeMetadata.alternates?.languages?.en).toBe("/");
    expect(homeMetadata.alternates?.languages?.vi).toBe("/vi");
    expect(homeMetadata.alternates?.languages?.ja).toBe("/ja");
    expect(homeMetadata.alternates?.languages?.["zh-CN"]).toBe("/zh-CN");

    expect(searchMetadata.title).toBe("Search");
    expect(String(searchMetadata.description)).toMatch(/you-agent-factory/i);
    expect(String(searchMetadata.description)).not.toMatch(/Model Atlas/i);
    expect(String(searchMetadata.description)).not.toMatch(
      /\batlas\b|Browse the Atlas/i,
    );

    expect(searchMetadata.alternates?.canonical).toBe("/search");
    expect(searchMetadata.alternates?.languages?.en).toBe("/search");
    expect(searchMetadata.alternates?.languages?.vi).toBe("/vi/search");
    expect(searchMetadata.alternates?.languages?.ja).toBe("/ja/search");
    expect(searchMetadata.alternates?.languages?.["zh-CN"]).toBe(
      "/zh-CN/search",
    );
  });

  it("publishes alternate-language metadata for tag and docs pages", async () => {
    const tagMetadata = await generateTagMetadata({
      params: Promise.resolve({ slug: "foundations" }),
    });
    const docsMetadata = await generateDocsMetadata({
      params: Promise.resolve({ slug: ["concepts", "harness"] }),
    });

    expect(tagMetadata.alternates?.canonical).toBe("/tags/foundations");
    expect(tagMetadata.alternates?.languages?.vi).toBe("/vi/tags/foundations");
    expect(tagMetadata.alternates?.languages?.ja).toBe("/ja/tags/foundations");
    expect(tagMetadata.alternates?.languages?.["zh-CN"]).toBe(
      "/zh-CN/tags/foundations",
    );

    expect(docsMetadata.alternates?.canonical).toBe("/docs/concepts/harness");
    expect(docsMetadata.alternates?.languages?.vi).toBe(
      "/vi/docs/concepts/harness",
    );
    expect(docsMetadata.alternates?.languages?.ja).toBe(
      "/ja/docs/concepts/harness",
    );
    expect(docsMetadata.alternates?.languages?.["zh-CN"]).toBe(
      "/zh-CN/docs/concepts/harness",
    );
  });

  it("keeps localized docs alternates fail closed for unfilled pages while advertising filled high-traffic locales", async () => {
    const gettingStartedMetadata = await generateLocalizedDocsMetadata({
      params: Promise.resolve({
        locale: "ja",
        slug: ["guides", "getting-started"],
      }),
    });
    const cliMetadata = await generateLocalizedDocsMetadata({
      params: Promise.resolve({
        locale: "zh-CN",
        slug: ["documentation", "cli"],
      }),
    });
    const unfilledConfigurationMetadata = await generateDocsMetadata({
      params: Promise.resolve({
        slug: ["documentation", "configuration"],
      }),
    });

    expect(gettingStartedMetadata.title).toBe("はじめに");
    expect(gettingStartedMetadata.alternates).toEqual({
      canonical: "/docs/guides/getting-started",
      languages: {
        en: "/docs/guides/getting-started",
        ja: "/ja/docs/guides/getting-started",
        "zh-CN": "/zh-CN/docs/guides/getting-started",
        vi: "/vi/docs/guides/getting-started",
      },
    });
    expect(cliMetadata.title).toBe("CLI");
    expect(cliMetadata.alternates).toEqual({
      canonical: "/docs/documentation/cli",
      languages: {
        en: "/docs/documentation/cli",
        ja: "/ja/docs/documentation/cli",
        "zh-CN": "/zh-CN/docs/documentation/cli",
        vi: "/vi/docs/documentation/cli",
      },
    });
    expect(unfilledConfigurationMetadata.alternates).toEqual({
      canonical: "/docs/documentation/configuration",
      languages: {
        en: "/docs/documentation/configuration",
      },
    });

    await expect(
      generateLocalizedDocsMetadata({
        params: Promise.resolve({
          locale: "ja",
          slug: ["documentation", "configuration"],
        }),
      }),
    ).rejects.toThrow(/notFound\(\)|NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  it("loads localized shell metadata copy from the requested locale", async () => {
    const jaHomeMetadata = await generateLocalizedHomeMetadata({
      params: Promise.resolve({ locale: "ja" }),
    });
    const zhCnHomeMetadata = await generateLocalizedHomeMetadata({
      params: Promise.resolve({ locale: "zh-CN" }),
    });
    const viHomeMetadata = await generateLocalizedHomeMetadata({
      params: Promise.resolve({ locale: "vi" }),
    });
    const jaSearchMetadata = await generateLocalizedSearchMetadata({
      params: Promise.resolve({ locale: "ja" }),
    });
    const jaArchitectureMetadata = await generateLocalizedArchitectureMetadata({
      params: Promise.resolve({ locale: "ja" }),
    });
    const jaGlossaryMetadata = await generateLocalizedGlossaryMetadata({
      params: Promise.resolve({ locale: "ja" }),
    });
    const jaTagsMetadata = await generateLocalizedTagsMetadata({
      params: Promise.resolve({ locale: "ja" }),
    });

    const englishHomeIntro =
      "you-agent-factory is the CLI documentation for installing the factory, running named goals, and operating harnesses, loops, reviews, planners, crons, and event streams.";

    expect(jaHomeMetadata.title).toBe("You Agent Factory");
    expect(jaHomeMetadata.description).toBe(
      "you-agent-factory は、ファクトリーのインストール、名前付きゴールの実行、およびハーネス、ループ、レビュー、プランナー、cron、イベントストリームの運用に関する CLI ドキュメントです。",
    );
    expect(String(jaHomeMetadata.title)).not.toMatch(/Model Atlas/i);
    expect(String(jaHomeMetadata.description)).not.toMatch(/Model Atlas/i);
    expect(String(jaHomeMetadata.description)).not.toBe(englishHomeIntro);

    expect(zhCnHomeMetadata.title).toBe("You Agent Factory");
    expect(zhCnHomeMetadata.description).toBe(
      "you-agent-factory 是用于安装工厂、运行命名目标，以及操作 harness、循环、审查、规划器、cron 与事件流的 CLI 文档。",
    );
    expect(String(zhCnHomeMetadata.description)).not.toBe(englishHomeIntro);
    expect(zhCnHomeMetadata.alternates?.languages?.["zh-CN"]).toBe("/zh-CN");

    expect(viHomeMetadata.title).toBe("You Agent Factory");
    expect(viHomeMetadata.description).toBe(
      "you-agent-factory là tài liệu CLI để cài đặt factory, chạy các mục tiêu có tên, và vận hành harness, vòng lặp, review, planner, cron, cùng luồng sự kiện.",
    );
    expect(String(viHomeMetadata.description)).not.toBe(englishHomeIntro);
    expect(viHomeMetadata.alternates?.languages?.vi).toBe("/vi");

    expect(jaSearchMetadata.title).toBe("検索");
    expect(jaSearchMetadata.description).toBe(
      "タイトル、別名、タグで you-agent-factory のドキュメントを検索します。検索コントロールを使ってガイド、概念、技法、ドキュメント、用語集の項目へ移動できます。",
    );
    expect(String(jaSearchMetadata.description)).toMatch(/you-agent-factory/i);
    expect(String(jaSearchMetadata.description)).not.toMatch(/Model Atlas/i);
    expect(String(jaSearchMetadata.description)).not.toMatch(
      /アトラス|\batlas\b/i,
    );

    expect(jaArchitectureMetadata.title).toBe("アーキテクチャ");
    expect(jaGlossaryMetadata.title).toBe("用語集");
    expect(jaTagsMetadata.title).toBe("タグ");

    expect(jaHomeMetadata.alternates?.canonical).toBe("/");
    expect(jaHomeMetadata.alternates?.languages?.en).toBe("/");
    expect(jaHomeMetadata.alternates?.languages?.vi).toBe("/vi");
    expect(jaHomeMetadata.alternates?.languages?.ja).toBe("/ja");
  });

  it("resolves high-traffic docs metadata from filled locale message bundles", async () => {
    const highTrafficPages = [
      {
        slug: ["guides", "getting-started"],
        titles: {
          ja: "はじめに",
          "zh-CN": "快速开始",
          vi: "Bắt đầu",
        },
      },
      {
        slug: ["documentation", "install"],
        titles: {
          ja: "you-agent-factory のインストール",
          "zh-CN": "安装 you-agent-factory",
          vi: "Cài đặt you-agent-factory",
        },
      },
      {
        slug: ["documentation", "cli"],
        titles: {
          ja: "CLI",
          "zh-CN": "CLI",
          vi: "CLI",
        },
      },
      {
        slug: ["guides", "using-you-agent-factory-for-loops"],
        titles: {
          ja: "you-agent-factory でループを使う",
          "zh-CN": "用 you-agent-factory 做循环",
          vi: "Dùng you-agent-factory cho vòng lặp",
        },
      },
    ] as const;

    for (const page of highTrafficPages) {
      const canonical = `/docs/${page.slug.join("/")}`;
      for (const locale of ["ja", "zh-CN", "vi"] as const) {
        const metadata = await generateLocalizedDocsMetadata({
          params: Promise.resolve({ locale, slug: [...page.slug] }),
        });

        expect(metadata.title).toBe(page.titles[locale]);
        expect(String(metadata.description).length).toBeGreaterThan(0);
        expect(metadata.alternates).toEqual({
          canonical,
          languages: {
            en: canonical,
            ja: `/ja${canonical}`,
            "zh-CN": `/zh-CN${canonical}`,
            vi: `/vi${canonical}`,
          },
        });
      }
    }

    const jaGettingStarted = await generateLocalizedDocsMetadata({
      params: Promise.resolve({
        locale: "ja",
        slug: ["guides", "getting-started"],
      }),
    });
    expect(String(jaGettingStarted.description)).not.toBe(
      "Install you-agent-factory, start a factory, and submit your first work.",
    );
  });

  it("generates localized docs routes for filled high-traffic pages and omits unfilled ones", async () => {
    const params = await generateLocalizedDocsStaticParams();
    const hasLocaleSlug = (locale: string, docsSlug: string) =>
      params.some(
        ({ locale: paramLocale, slug }) =>
          paramLocale === locale && slug?.join("/") === docsSlug,
      );

    for (const locale of ["ja", "zh-CN", "vi"] as const) {
      expect(hasLocaleSlug(locale, "guides/getting-started")).toBe(true);
      expect(hasLocaleSlug(locale, "documentation/install")).toBe(true);
      expect(hasLocaleSlug(locale, "documentation/cli")).toBe(true);
      expect(
        hasLocaleSlug(locale, "guides/using-you-agent-factory-for-loops"),
      ).toBe(true);
      expect(hasLocaleSlug(locale, "guides/write-review-loops")).toBe(true);
      expect(hasLocaleSlug(locale, "guides/cursor-dynamic-workflows")).toBe(
        true,
      );
      expect(hasLocaleSlug(locale, "documentation/configuration")).toBe(false);
      expect(hasLocaleSlug(locale, "modules/grouped-query-attention")).toBe(
        false,
      );
    }
  });
});
