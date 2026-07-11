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
  assertFactoryBreadcrumbSegments,
  resolveFactorySidebarFolderLabel,
} from "@/lib/content/factory-breadcrumb-sidebar";
import { localizeDocsHref } from "@/lib/content/localized-docs-href";
import type { UiMessages } from "@/lib/content/ui-messages.types";
import type { DocsCollectionId } from "@/lib/docs/collection-definition-contract";
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

function getFactoryCollectionLabel(section: DocsCollectionId): string {
  return (
    source.getPage([section])?.data.title ??
    resolveFactorySidebarFolderLabel(section)
  );
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
        label: getFactoryCollectionLabel(section),
        href: localizeDocsHref(`/docs/${section}`, locale),
      });
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
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
              >
                {segment.label}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className="text-xs font-medium uppercase tracking-[0.18em] text-foreground">
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
