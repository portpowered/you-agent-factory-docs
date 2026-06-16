"use client";

import { SharedShell } from "@/components/shell/shared-shell";
import { useMessages } from "@/localization/hooks/use-messages";
import { createSharedShellConfigFromMessages } from "@/localization/lib/create-shared-shell-config";

export function DocsShell() {
  const { t } = useMessages();
  const config = createSharedShellConfigFromMessages(t);

  return (
    <SharedShell config={config} currentDocsItemId="overview" surface="docs">
      <article aria-labelledby="docs-shell-title">
        <h1 id="docs-shell-title">{t("docs.shellTitle")}</h1>
        <p className="docs-shell__framing">{t("docs.framingText")}</p>
      </article>
    </SharedShell>
  );
}
