"use client";

import { ShellDisclosurePanel } from "@/components/shell/shell-disclosure-panel";
import { ShellDisclosureTrigger } from "@/components/shell/shell-disclosure-trigger";
import { useShellDisclosure } from "@/hooks/layout/useShellDisclosure";
import {
  type SharedShellConfig,
  type SharedShellSurface,
  getSharedShellCurrentDestinationId,
  getSharedShellHeaderDestinations,
} from "@/lib/shared-shell-config";
import { SharedShellPrimaryNavigation } from "./shared-shell-navigation";

const SHARED_SHELL_PRIMARY_NAV_PANEL_ID = "shared-shell-primary-nav";

export type SharedShellHeaderProps = {
  config: SharedShellConfig;
  surface: SharedShellSurface;
};

export function SharedShellHeader({ config, surface }: SharedShellHeaderProps) {
  const headerDestinations = getSharedShellHeaderDestinations(surface, config);
  const currentDestinationId = getSharedShellCurrentDestinationId(
    surface,
    config,
  );
  const disclosure = useShellDisclosure({
    panelId: SHARED_SHELL_PRIMARY_NAV_PANEL_ID,
  });
  const navigationDisclosure = config.responsive.navigationDisclosure;

  return (
    <header className="border-b bg-card px-5 py-4 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <p className="m-0 text-base font-semibold tracking-tight">
          {config.brand}
        </p>
        <ShellDisclosureTrigger
          className="max-[1023px]:inline-flex"
          disclosure={disclosure}
        >
          {({ isOpen }) =>
            isOpen
              ? navigationDisclosure.closeLabel
              : navigationDisclosure.openLabel
          }
        </ShellDisclosureTrigger>
      </div>
      <ShellDisclosurePanel
        className="contents max-[1023px]:mt-3 max-[1023px]:block max-[1023px]:w-full data-[shell-disclosure=open]:animate-[shell-disclosure-reveal_200ms_ease-out] motion-reduce:data-[shell-disclosure=open]:animate-none"
        disclosure={disclosure}
      >
        <SharedShellPrimaryNavigation
          ariaLabel={config.primaryNavigation.ariaLabel}
          currentDestinationId={currentDestinationId}
          destinations={headerDestinations}
        />
      </ShellDisclosurePanel>
    </header>
  );
}
