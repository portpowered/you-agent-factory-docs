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
    <div className="contents max-[1023px]:flex max-[1023px]:flex-col max-[1023px]:gap-3 max-[1023px]:px-5 md:max-[1023px]:px-6">
      <ShellDisclosureTrigger
        className="max-[1023px]:inline-flex"
        disclosure={disclosure}
      >
        {({ isOpen }) =>
          isOpen
            ? docsNavigationDisclosure.closeLabel
            : docsNavigationDisclosure.openLabel
        }
      </ShellDisclosureTrigger>
      <ShellDisclosurePanel
        className="contents max-[1023px]:block data-[shell-disclosure=open]:animate-[shell-disclosure-reveal_200ms_ease-out] motion-reduce:data-[shell-disclosure=open]:animate-none"
        disclosure={disclosure}
      >
        <aside className="divide-y border-r bg-card xl:min-h-full max-[1023px]:border-r-0 max-[1023px]:border-t">
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
