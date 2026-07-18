import { describe, expect, test } from "bun:test";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  buildLocalizedRoute,
  type SiteLocale,
  supportedLocales,
} from "@/lib/i18n/locale-routing";
import {
  SITE_NAMED_ROUTE_SURFACES,
  type SiteConfig,
} from "./site-config.contract";
import { youAgentFactorySiteConfig } from "./you-agent-factory-site-config";

/** Stable W15 family route-surface ids and default-locale paths. */
const FAMILY_ROUTE_SURFACES = [
  { id: "references", path: "/docs/references" },
  { id: "factories", path: "/docs/factories" },
  { id: "workers", path: "/docs/workers" },
  { id: "workstations", path: "/docs/workstations" },
] as const;

const FAMILY_NAV_LABEL_KEYS = [
  "references",
  "factories",
  "workers",
  "workstations",
] as const;

function resolveFamilyHref(
  config: SiteConfig,
  routeSurface: (typeof FAMILY_ROUTE_SURFACES)[number]["id"],
  locale: SiteLocale,
): string {
  const destination = config.routeSurfaces[routeSurface];
  if (!destination) {
    throw new Error(`Missing site config route surface: ${routeSurface}`);
  }
  return buildLocalizedRoute(destination, locale);
}

describe("W15 family route surfaces and topology label keys", () => {
  test("documents the four family ids among named route-surface placeholders", () => {
    for (const { id } of FAMILY_ROUTE_SURFACES) {
      expect(SITE_NAMED_ROUTE_SURFACES).toContain(id);
    }
  });

  test("default site config resolves family destinations for the default locale", () => {
    for (const { id, path } of FAMILY_ROUTE_SURFACES) {
      expect(resolveFamilyHref(youAgentFactorySiteConfig, id, "en")).toBe(path);
    }
  });

  test("family destinations honor shipped locale routing prefixes", () => {
    for (const locale of supportedLocales) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      for (const { id, path } of FAMILY_ROUTE_SURFACES) {
        expect(resolveFamilyHref(youAgentFactorySiteConfig, id, locale)).toBe(
          `${prefix}${path}`,
        );
      }
    }
  });

  test("shipped locales expose reader-visible family nav labels, not raw route ids", async () => {
    const expectedByLocale: Record<
      SiteLocale,
      Record<(typeof FAMILY_NAV_LABEL_KEYS)[number], string>
    > = {
      en: {
        references: "References",
        factories: "Factories",
        workers: "Workers",
        workstations: "Workstations",
      },
      ja: {
        references: "リファレンス",
        factories: "ファクトリー",
        workers: "ワーカー",
        workstations: "ワークステーション",
      },
      "zh-CN": {
        references: "参考",
        factories: "工厂",
        workers: "工作器",
        workstations: "工作站",
      },
      vi: {
        references: "Tham chiếu",
        factories: "Factory",
        workers: "Worker",
        workstations: "Workstation",
      },
    };

    for (const locale of supportedLocales) {
      const messages = await loadUiMessages(locale);
      const expected = expectedByLocale[locale];

      for (const key of FAMILY_NAV_LABEL_KEYS) {
        const label = messages.nav[key];
        expect(label.trim().length).toBeGreaterThan(0);
        expect(label).toBe(expected[key]);
        expect(label).not.toBe(key);
        expect(label).not.toBe(`/docs/${key}`);
      }
    }
  });

  test("family label keys are valid primary-nav label keys for later wiring", () => {
    for (const key of FAMILY_NAV_LABEL_KEYS) {
      const entry = {
        routeSurface: key,
        labelKey: key,
      } satisfies SiteConfig["primaryNav"][number];
      expect(entry.labelKey).toBe(key);
      expect(
        youAgentFactorySiteConfig.routeSurfaces[entry.routeSurface],
      ).toEqual({ surface: "docs-page", slug: key });
    }
  });
});
