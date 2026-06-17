"use client";

import { ShellDisclosurePanel } from "@/components/shell/shell-disclosure-panel";
import { ShellDisclosureTrigger } from "@/components/shell/shell-disclosure-trigger";
import { useShellDisclosure } from "@/hooks/layout/useShellDisclosure";
import type { SharedShellConfig } from "@/lib/shared-shell-config";
import { getSharedShellDocsNavigationGroups } from "@/lib/shared-shell-extension-points";
import { SharedShellDocsNavigation } from "./shared-shell-navigation";

const SHARED_SHELL_DOCS_ASIDE_PANEL_ID = "shared-shell-docs-aside";

export type SharedShellDocsAsideProps = {
  config: SharedShellConfig;
  currentDocsItemId?: string;
};

export function SharedShellDocsAside({
  config,
  currentDocsItemId = "overview",
}: SharedShellDocsAsideProps) {
  const disclosure = useShellDisclosure({
    panelId: SHARED_SHELL_DOCS_ASIDE_PANEL_ID,
  });
  const docsNavigationGroups = getSharedShellDocsNavigationGroups(config);
  const docsNavigationDisclosure = config.responsive.docsNavigationDisclosure;

  if (docsNavigationGroups.length === 0) {
    return null;
  }

  return (
    <div className="shared-shell__docs-aside-region">
      <ShellDisclosureTrigger
        className="shared-shell__docs-nav-toggle"
        disclosure={disclosure}
      >
        {({ isOpen }) =>
          isOpen
            ? docsNavigationDisclosure.closeLabel
            : docsNavigationDisclosure.openLabel
        }
      </ShellDisclosureTrigger>
      <ShellDisclosurePanel
        className="shared-shell__docs-aside-panel"
        disclosure={disclosure}
      >
        <aside className="shared-shell__docs-aside">
          {docsNavigationGroups.map((docsNavigation) => (
            <SharedShellDocsNavigation
              ariaLabel={docsNavigation.heading}
              currentItemId={currentDocsItemId}
              heading={docsNavigation.heading}
              items={docsNavigation.items}
              key={docsNavigation.heading}
            />
          ))}
        </aside>
      </ShellDisclosurePanel>
    </div>
  );
}
