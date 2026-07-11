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

    expect(homeMetadata.title).toBe("you-agent-factory");
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
      params: Promise.resolve({ slug: "attention" }),
    });
    const docsMetadata = await generateDocsMetadata({
      params: Promise.resolve({ slug: ["modules", "grouped-query-attention"] }),
    });

    expect(tagMetadata.alternates?.canonical).toBe("/tags/attention");
    expect(tagMetadata.alternates?.languages?.vi).toBe("/vi/tags/attention");
    expect(tagMetadata.alternates?.languages?.ja).toBe("/ja/tags/attention");

    expect(docsMetadata.alternates?.canonical).toBe(
      "/docs/modules/grouped-query-attention",
    );
    expect(docsMetadata.alternates?.languages?.vi).toBe(
      "/vi/docs/modules/grouped-query-attention",
    );
    expect(docsMetadata.alternates?.languages?.ja).toBe(
      "/ja/docs/modules/grouped-query-attention",
    );
  });

  it("keeps localized docs alternates fail closed for the shipped japanese attention proof set", async () => {
    const multiQueryMetadata = await generateLocalizedDocsMetadata({
      params: Promise.resolve({
        locale: "ja",
        slug: ["modules", "multi-query-attention"],
      }),
    });
    const slidingWindowMetadata = await generateLocalizedDocsMetadata({
      params: Promise.resolve({
        locale: "ja",
        slug: ["modules", "sliding-window-attention"],
      }),
    });
    const kvCacheMetadata = await generateDocsMetadata({
      params: Promise.resolve({ slug: ["glossary", "kv-cache"] }),
    });

    expect(multiQueryMetadata.alternates).toEqual({
      canonical: "/docs/modules/multi-query-attention",
      languages: {
        en: "/docs/modules/multi-query-attention",
        ja: "/ja/docs/modules/multi-query-attention",
        vi: "/vi/docs/modules/multi-query-attention",
      },
    });
    expect(slidingWindowMetadata.alternates).toEqual({
      canonical: "/docs/modules/sliding-window-attention",
      languages: {
        en: "/docs/modules/sliding-window-attention",
        ja: "/ja/docs/modules/sliding-window-attention",
        vi: "/vi/docs/modules/sliding-window-attention",
      },
    });
    expect(multiQueryMetadata.title).toBe("マルチクエリ attention");
    expect(slidingWindowMetadata.title).toBe(
      "スライディングウィンドウ attention",
    );
    expect(kvCacheMetadata.alternates).toEqual({
      canonical: "/docs/glossary/kv-cache",
      languages: {
        en: "/docs/glossary/kv-cache",
      },
    });
  });

  it("loads localized shell metadata copy from the requested locale", async () => {
    const jaHomeMetadata = await generateLocalizedHomeMetadata({
      params: Promise.resolve({ locale: "ja" }),
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

    expect(jaHomeMetadata.title).toBe("you-agent-factory");
    expect(jaHomeMetadata.description).toBe(
      "you-agent-factory は、ファクトリーのインストール、名前付きゴールの実行、およびハーネス、ループ、レビュー、プランナー、cron、イベントストリームの運用に関する CLI ドキュメントです。",
    );
    expect(String(jaHomeMetadata.title)).not.toMatch(/Model Atlas/i);
    expect(String(jaHomeMetadata.description)).not.toMatch(/Model Atlas/i);
    expect(String(jaHomeMetadata.description)).not.toBe(
      "you-agent-factory is the CLI documentation for installing the factory, running named goals, and operating harnesses, loops, reviews, planners, crons, and event streams.",
    );

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

  it("generates japanese docs routes for the shipped attention proof set", async () => {
    const params = await generateLocalizedDocsStaticParams();

    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" &&
          slug?.join("/") === "modules/grouped-query-attention",
      ),
    ).toBe(true);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" && slug?.join("/") === "modules/attention",
      ),
    ).toBe(true);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" && slug?.join("/") === "glossary/token",
      ),
    ).toBe(true);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" &&
          slug?.join("/") === "concepts/transformer-architecture",
      ),
    ).toBe(true);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" && slug?.join("/") === "modules/multi-head-attention",
      ),
    ).toBe(true);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" &&
          slug?.join("/") === "modules/multi-query-attention",
      ),
    ).toBe(true);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" &&
          slug?.join("/") === "modules/sliding-window-attention",
      ),
    ).toBe(true);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" && slug?.join("/") === "modules/linear-attention",
      ),
    ).toBe(true);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "ja" && slug?.join("/") === "modules/swiglu",
      ),
    ).toBe(false);
    expect(
      params.some(
        ({ locale, slug }) =>
          locale === "vi" &&
          slug?.join("/") === "modules/grouped-query-attention",
      ),
    ).toBe(true);
  });
});
