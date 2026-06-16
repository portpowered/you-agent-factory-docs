"use client";

import { ShellDisclosurePanel } from "@/components/shell/shell-disclosure-panel";
import { ShellDisclosureTrigger } from "@/components/shell/shell-disclosure-trigger";
import { useShellDisclosure } from "@/hooks/layout/useShellDisclosure";
import { DOCS_NAV_SECTION } from "@/lib/docs-nav";
import {
  DOCS_NAV_DISCLOSURE_HIDE_LABEL,
  DOCS_NAV_DISCLOSURE_SHOW_LABEL,
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
        <nav aria-label={DOCS_NAV_SECTION.heading} className="docs-shell__nav">
          <p className="docs-shell__nav-heading">{DOCS_NAV_SECTION.heading}</p>
          <ul className="docs-shell__nav-list">
            {DOCS_NAV_SECTION.items.map((item) => (
              <li key={item.href}>
                <Link
                  aria-current={item.isCurrent ? "page" : undefined}
                  className={
                    item.isCurrent
                      ? "docs-shell__nav-link docs-shell__nav-link--active"
                      : "docs-shell__nav-link"
                  }
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </ShellDisclosurePanel>
    </div>
  );
}
