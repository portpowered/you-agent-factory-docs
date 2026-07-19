import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DOCS_CHROME_BREADCRUMB_LINK_CLASSES,
  DOCS_CHROME_BREADCRUMB_PAGE_CLASSES,
} from "@/features/docs/styles/docs-chrome-header-breadcrumb";
import {
  assertFactoryBreadcrumbSegments,
  resolveFactorySidebarFolderLabel,
} from "@/lib/content/factory-breadcrumb-sidebar";
import { localizeDocsHref } from "@/lib/content/localized-docs-href";
import type {
  ExplorerFolderMessages,
  UiMessages,
} from "@/lib/content/ui-messages.types";
import {
  DIRECT_DOCS_ROUTE_FAMILY_IDS,
  type DirectDocsRouteFamilyId,
  type DocsCollectionId,
} from "@/lib/docs/collection-definition-contract";
import { isAcceptedDocsSourceSection } from "@/lib/docs/docs-collection-slug-acceptance";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";
import { source } from "@/lib/source";

type BreadcrumbSegment = {
  label: string;
  href?: string;
};

type DocsPageBreadcrumbProps = {
  locale?: SiteLocale;
  messages: UiMessages;
  slug: string[] | undefined;
  title: string;
};

const DIRECT_DOCS_ROUTE_FAMILY_ID_SET = new Set<string>(
  DIRECT_DOCS_ROUTE_FAMILY_IDS,
);

function isDirectDocsRouteFamilyId(
  section: string,
): section is DirectDocsRouteFamilyId {
  return DIRECT_DOCS_ROUTE_FAMILY_ID_SET.has(section);
}

/**
 * Resolve the collection/family crumb label from topology message catalogs.
 * W15 families use story-001 `nav.*` keys; explorer folders and glossary use
 * their localized chrome labels. English folder constants remain last resort.
 */
function getFactoryCollectionLabel(
  section: DocsCollectionId,
  messages: UiMessages,
): string {
  if (isDirectDocsRouteFamilyId(section)) {
    return messages.nav[section];
  }

  const explorerFolders = messages.explorer.folders;
  if (section in explorerFolders) {
    return explorerFolders[section as keyof ExplorerFolderMessages];
  }

  if (section === "glossary") {
    return messages.nav.glossary;
  }

  return (
    source.getPage([section])?.data.title ??
    resolveFactorySidebarFolderLabel(section)
  );
}

function resolveAncestryCrumbLabel(ancestrySlug: string[]): string {
  const pageTitle = source.getPage(ancestrySlug)?.data.title;
  if (typeof pageTitle === "string" && pageTitle.trim().length > 0) {
    return pageTitle;
  }

  const leaf = ancestrySlug[ancestrySlug.length - 1] ?? "";
  return leaf
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildDocsBreadcrumbSegments(
  slug: string[] | undefined,
  title: string,
  messages: UiMessages,
  locale: SiteLocale = defaultLocale,
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [
    {
      label: messages.nav.home,
      href: buildLocalizedRoute({ surface: "home" }, locale),
    },
  ];

  if (slug && slug.length >= 2) {
    const section = slug[0];
    if (section && isAcceptedDocsSourceSection(section)) {
      segments.push({
        label: getFactoryCollectionLabel(section, messages),
        href: localizeDocsHref(`/docs/${section}`, locale),
      });

      // Deeper nested ancestry between the family/collection crumb and the
      // current page (slug segments 1..n-2), when present.
      for (let index = 1; index < slug.length - 1; index += 1) {
        const ancestrySlug = slug.slice(0, index + 1);
        segments.push({
          label: resolveAncestryCrumbLabel(ancestrySlug),
          href: localizeDocsHref(`/docs/${ancestrySlug.join("/")}`, locale),
        });
      }
    }
  }

  segments.push({ label: title });
  assertFactoryBreadcrumbSegments(segments);

  return segments;
}

export function DocsPageBreadcrumb({
  locale = defaultLocale,
  messages,
  slug,
  title,
}: DocsPageBreadcrumbProps) {
  const segments = buildDocsBreadcrumbSegments(slug, title, messages, locale);
  const lastIndex = segments.length - 1;

  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList>
        {segments.map((segment, index) => (
          <BreadcrumbItem key={`${segment.href ?? "current"}-${segment.label}`}>
            {segment.href && index !== lastIndex ? (
              <BreadcrumbLink
                render={<Link href={segment.href} />}
                className={DOCS_CHROME_BREADCRUMB_LINK_CLASSES}
              >
                {segment.label}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className={DOCS_CHROME_BREADCRUMB_PAGE_CLASSES}>
                {segment.label}
              </BreadcrumbPage>
            )}
            {index < lastIndex ? <BreadcrumbSeparator /> : null}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
