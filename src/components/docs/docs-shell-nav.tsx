"use client";

import { ShellDisclosurePanel } from "@/components/shell/shell-disclosure-panel";
import { ShellDisclosureTrigger } from "@/components/shell/shell-disclosure-trigger";
import { useShellDisclosure } from "@/hooks/layout/useShellDisclosure";
import { DOCS_ENTRY_ROUTE } from "@/lib/project";
import {
  DOCS_NAV_DISCLOSURE_HIDE_LABEL,
  DOCS_NAV_DISCLOSURE_SHOW_LABEL,
  DOCS_NAV_HEADING,
  DOCS_NAV_OVERVIEW_LABEL,
} from "@/lib/shell";
import Link from "next/link";

const DOCS_SHELL_NAV_PANEL_ID = "docs-shell-nav-panel";

export function DocsShellNav() {
  const disclosure = useShellDisclosure({ panelId: DOCS_SHELL_NAV_PANEL_ID });

  return (
    <div className="docs-shell__nav-region">
      <ShellDisclosureTrigger
        className="docs-shell__nav-toggle"
        disclosure={disclosure}
      >
        {({ isOpen }) =>
          isOpen
            ? DOCS_NAV_DISCLOSURE_HIDE_LABEL
            : DOCS_NAV_DISCLOSURE_SHOW_LABEL
        }
      </ShellDisclosureTrigger>

      <ShellDisclosurePanel
        className="docs-shell__nav-panel"
        disclosure={disclosure}
      >
        <nav aria-label={DOCS_NAV_HEADING} className="docs-shell__nav">
          <p className="docs-shell__nav-heading">{DOCS_NAV_HEADING}</p>
          <ul className="docs-shell__nav-list">
            <li>
              <Link
                aria-current="page"
                className="docs-shell__nav-link docs-shell__nav-link--active"
                href={DOCS_ENTRY_ROUTE}
              >
                {DOCS_NAV_OVERVIEW_LABEL}
              </Link>
            </li>
          </ul>
        </nav>
      </ShellDisclosurePanel>
    </div>
  );
}
