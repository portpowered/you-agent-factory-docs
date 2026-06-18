"use client";

import { PublicContentArticle } from "@/components/content/public-content-article";
import { DocsBreadcrumbs } from "@/components/docs/docs-breadcrumbs";
import { SharedShell } from "@/components/shell/shared-shell";
import type { CanonicalContentRecord } from "@/lib/content/types";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import { useMessages } from "@/localization/hooks/use-messages";
import { createSharedShellConfigFromMessages } from "@/localization/lib/create-shared-shell-config";
import type { SharedShellMessageKey } from "@/types/localization";

export type PublicContentPageShellProps = {
  body: string;
  record: CanonicalContentRecord;
  title: string;
};

const PUBLIC_CONTENT_SECTION_LABEL_KEYS: Partial<
  Record<CanonicalContentRecord["kind"], SharedShellMessageKey>
> = {
  comparison: "docs.comparisonSectionLabel",
  glossary: "docs.glossarySectionLabel",
  reference: "docs.referenceSectionLabel",
};

export function PublicContentPageShell({
  body,
  record,
  title,
}: PublicContentPageShellProps) {
  const { t } = useMessages();
  const shellConfig = createSharedShellConfigFromMessages(t);
  const sectionLabelKey = PUBLIC_CONTENT_SECTION_LABEL_KEYS[record.kind];
  const breadcrumbItems = [
    { label: t("docs.shellTitle"), href: DOCS_ENTRY_ROUTE },
    ...(sectionLabelKey ? [{ label: t(sectionLabelKey) }] : []),
    { label: title },
  ];

  return (
    <SharedShell config={shellConfig} surface="home">
      <DocsBreadcrumbs
        ariaLabel={t("docs.breadcrumbAriaLabel")}
        trail={{ items: breadcrumbItems }}
      />
      <PublicContentArticle body={body} record={record} title={title} />
    </SharedShell>
  );
}
