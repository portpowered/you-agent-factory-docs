"use client";

import { useSharedShellNavigationDisclosure } from "@/hooks/use-shared-shell-navigation-disclosure";
import {
  type SharedShellConfig,
  type SharedShellSurface,
  getSharedShellCurrentDestinationId,
  getSharedShellHeaderDestinations,
} from "@/lib/shared-shell-config";
import { SharedShellPrimaryNavigation } from "./shared-shell-navigation";

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
  const { isOpen, toggle } = useSharedShellNavigationDisclosure();
  const disclosure = config.responsive.navigationDisclosure;
  const menuToggleLabel = isOpen ? disclosure.closeLabel : disclosure.openLabel;

  return (
    <header className="shared-shell__header">
      <div className="shared-shell__header-row">
        <p className="shared-shell__brand">{config.brand}</p>
        <button
          aria-controls="shared-shell-primary-nav"
          aria-expanded={isOpen}
          aria-label={menuToggleLabel}
          className="shared-shell__menu-toggle"
          onClick={toggle}
          type="button"
        >
          {menuToggleLabel}
        </button>
      </div>
      <SharedShellPrimaryNavigation
        ariaLabel={config.primaryNavigation.ariaLabel}
        className={isOpen ? "shared-shell__header-nav--open" : undefined}
        currentDestinationId={currentDestinationId}
        destinations={headerDestinations}
        id="shared-shell-primary-nav"
      />
    </header>
  );
}
