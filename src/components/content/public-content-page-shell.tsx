"use client";

import { PublicContentArticle } from "@/components/content/public-content-article";
import { SharedShell } from "@/components/shell/shared-shell";
import type { CanonicalContentRecord } from "@/lib/content/types";
import { useMessages } from "@/localization/hooks/use-messages";
import { createSharedShellConfigFromMessages } from "@/localization/lib/create-shared-shell-config";

export type PublicContentPageShellProps = {
  body: string;
  record: CanonicalContentRecord;
  title: string;
};

export function PublicContentPageShell({
  body,
  record,
  title,
}: PublicContentPageShellProps) {
  const { t } = useMessages();
  const shellConfig = createSharedShellConfigFromMessages(t);

  return (
    <SharedShell config={shellConfig} surface="home">
      <PublicContentArticle body={body} record={record} title={title} />
    </SharedShell>
  );
}
