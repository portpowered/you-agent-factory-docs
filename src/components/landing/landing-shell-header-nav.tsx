"use client";

import { ShellDisclosurePanel } from "@/components/shell/shell-disclosure-panel";
import { ShellDisclosureTrigger } from "@/components/shell/shell-disclosure-trigger";
import { useShellDisclosure } from "@/hooks/layout/useShellDisclosure";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  LANDING_NAV_DISCLOSURE_HIDE_LABEL,
  LANDING_NAV_DISCLOSURE_SHOW_LABEL,
} from "@/lib/shell";
import Link from "next/link";

const LANDING_SHELL_NAV_PANEL_ID = "landing-shell-nav-panel";

export function LandingShellHeaderNav() {
  const disclosure = useShellDisclosure({
    panelId: LANDING_SHELL_NAV_PANEL_ID,
  });

  return (
    <div className="landing-shell__header-nav-region">
      <ShellDisclosureTrigger
        className="landing-shell__nav-toggle"
        disclosure={disclosure}
      >
        {({ isOpen }) =>
          isOpen
            ? LANDING_NAV_DISCLOSURE_HIDE_LABEL
            : LANDING_NAV_DISCLOSURE_SHOW_LABEL
        }
      </ShellDisclosureTrigger>

      <ShellDisclosurePanel
        className="landing-shell__nav-panel"
        disclosure={disclosure}
      >
        <nav aria-label="Primary" className="landing-shell__header-nav">
          <Link className="landing-shell__link" href={DOCS_ENTRY_ROUTE}>
            {DOCS_CTA_LABEL}
          </Link>
          <a
            className="landing-shell__link landing-shell__link--external"
            href={GITHUB_REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            {GITHUB_CTA_LABEL}
          </a>
        </nav>
      </ShellDisclosurePanel>
    </div>
  );
}
