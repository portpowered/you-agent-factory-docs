"use client";

import { SharedShell } from "@/components/shell/shared-shell";
import { DOCS_ENTRY_ROUTE, PROJECT_NAME } from "@/lib/project";
import { GITHUB_REPO_URL } from "@/lib/shared-shell-config";
import { useMessages } from "@/localization/hooks/use-messages";
import { createSharedShellConfigFromMessages } from "@/localization/lib/create-shared-shell-config";
import Link from "next/link";

export function LandingShell() {
  const { t } = useMessages();
  const config = createSharedShellConfigFromMessages(t);

  return (
    <SharedShell config={config} surface="home">
      <section
        aria-labelledby="landing-hero-title"
        className="landing-shell__hero"
      >
        <h1 id="landing-hero-title">{PROJECT_NAME}</h1>
        <p className="landing-shell__value">{t("landing.valueStatement")}</p>
        <div className="landing-shell__cta-row">
          <Link className="landing-shell__button" href={DOCS_ENTRY_ROUTE}>
            {t("common.getStarted")}
          </Link>
          <a
            className="landing-shell__button landing-shell__button--secondary"
            href={GITHUB_REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("common.githubCta")}
          </a>
        </div>
      </section>
    </SharedShell>
  );
}
