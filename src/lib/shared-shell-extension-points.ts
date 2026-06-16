import type {
  SharedShellConfig,
  SharedShellDocsNavigationGroup,
} from "@/lib/shared-shell-config";
import { sharedShellConfig } from "@/lib/shared-shell-config";

/**
 * Canonical shell data later lanes extend through `sharedShellConfig` or
 * `createSharedShellConfig`. Keep labels, destinations, and structural options here.
 */
export const SHARED_SHELL_CANONICAL_EXTENSION_POINTS = {
  brand: "Site title shown in the shared header and optional footer",
  primaryNavigation:
    "Global destination registry, aria label, and link metadata",
  headerDestinationIdsBySurface:
    "Per-surface subset of primary destinations shown in the header",
  docsNavigationGroups:
    "Docs sidebar navigation groups; extend the array for richer docs IA",
  structural: "Footer text, docs sidebar visibility, and frame options",
  responsive:
    "Breakpoint and disclosure labels; keep in sync with shared-shell CSS",
} as const;

/**
 * Route-projected or transient shell behavior. Do not store these in
 * `sharedShellConfig`; surface wrappers and client header state own them.
 */
export const SHARED_SHELL_PROJECTED_EXTENSION_POINTS = {
  children:
    "Page-specific main content composed by landing/docs surface wrappers",
  currentDocsItemId:
    "Active docs sidebar item id for current-location treatment",
  navigationDisclosure:
    "Narrow-width menu open/closed state from useSharedShellNavigationDisclosure",
} as const;

export type SharedShellConfigOverrides = Partial<
  Omit<SharedShellConfig, "primaryNavigation" | "structural" | "responsive">
> & {
  primaryNavigation?: Partial<SharedShellConfig["primaryNavigation"]>;
  structural?: Partial<SharedShellConfig["structural"]>;
  responsive?: Partial<SharedShellConfig["responsive"]>;
  docsNavigationGroups?: SharedShellDocsNavigationGroup[];
};

/** Merge lane-specific shell configuration onto the default shared shell contract. */
export function createSharedShellConfig(
  overrides: SharedShellConfigOverrides,
): SharedShellConfig {
  return {
    ...sharedShellConfig,
    ...overrides,
    primaryNavigation: overrides.primaryNavigation
      ? {
          ...sharedShellConfig.primaryNavigation,
          ...overrides.primaryNavigation,
          destinations:
            overrides.primaryNavigation.destinations ??
            sharedShellConfig.primaryNavigation.destinations,
        }
      : sharedShellConfig.primaryNavigation,
    headerDestinationIdsBySurface:
      overrides.headerDestinationIdsBySurface ??
      sharedShellConfig.headerDestinationIdsBySurface,
    docsNavigationGroups:
      overrides.docsNavigationGroups ?? sharedShellConfig.docsNavigationGroups,
    structural: overrides.structural
      ? { ...sharedShellConfig.structural, ...overrides.structural }
      : sharedShellConfig.structural,
    responsive: overrides.responsive
      ? {
          ...sharedShellConfig.responsive,
          ...overrides.responsive,
          navigationDisclosure: overrides.responsive.navigationDisclosure
            ? {
                ...sharedShellConfig.responsive.navigationDisclosure,
                ...overrides.responsive.navigationDisclosure,
              }
            : sharedShellConfig.responsive.navigationDisclosure,
        }
      : sharedShellConfig.responsive,
  };
}

export function getSharedShellDocsNavigationGroups(
  config: SharedShellConfig = sharedShellConfig,
): SharedShellDocsNavigationGroup[] {
  return config.docsNavigationGroups;
}
