import { FACTORY_EXPLORER_FOLDER_LABELS } from "@/lib/content/factory-breadcrumb-sidebar";
import {
  DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
  SIDEBAR_GROUP_LABELS,
} from "@/lib/content/sidebar-grouping";
import type {
  ExplorerMessages,
  UiMessages,
} from "@/lib/content/ui-messages.types";

export class ExplorerLabelsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExplorerLabelsError";
  }
}

function assertNonEmptyLabel(
  path: string,
  value: unknown,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ExplorerLabelsError(
      `Explorer label "${path}" is missing or empty; localized explorer chrome fails closed without English fallback.`,
    );
  }
}

/**
 * Fail closed when explorer folder/subgroup message catalogs are incomplete.
 * Callers must not silently fall back to English constants for unfilled locales.
 */
export function assertExplorerMessages(
  explorer: unknown,
): asserts explorer is ExplorerMessages {
  if (!explorer || typeof explorer !== "object") {
    throw new ExplorerLabelsError(
      "Explorer messages are missing; localized explorer chrome fails closed without English fallback.",
    );
  }

  const record = explorer as Record<string, unknown>;
  const folders = record.folders;
  const conceptsGroups = record.conceptsGroups;
  const documentationGroups = record.documentationGroups;
  const documentationSecondaries = record.documentationSecondaries;

  if (!folders || typeof folders !== "object") {
    throw new ExplorerLabelsError(
      "Explorer folder messages are missing; localized explorer chrome fails closed without English fallback.",
    );
  }
  if (!conceptsGroups || typeof conceptsGroups !== "object") {
    throw new ExplorerLabelsError(
      "Explorer Concepts group messages are missing; localized explorer chrome fails closed without English fallback.",
    );
  }
  if (!documentationGroups || typeof documentationGroups !== "object") {
    throw new ExplorerLabelsError(
      "Explorer Program documentation group messages are missing; localized explorer chrome fails closed without English fallback.",
    );
  }
  if (
    !documentationSecondaries ||
    typeof documentationSecondaries !== "object"
  ) {
    throw new ExplorerLabelsError(
      "Explorer Program documentation secondary messages are missing; localized explorer chrome fails closed without English fallback.",
    );
  }

  for (const id of Object.keys(FACTORY_EXPLORER_FOLDER_LABELS) as Array<
    keyof typeof FACTORY_EXPLORER_FOLDER_LABELS
  >) {
    assertNonEmptyLabel(
      `explorer.folders.${id}`,
      (folders as Record<string, unknown>)[id],
    );
  }

  for (const id of Object.keys(SIDEBAR_GROUP_LABELS.concepts) as Array<
    keyof typeof SIDEBAR_GROUP_LABELS.concepts
  >) {
    assertNonEmptyLabel(
      `explorer.conceptsGroups.${id}`,
      (conceptsGroups as Record<string, unknown>)[id],
    );
  }

  for (const id of Object.keys(SIDEBAR_GROUP_LABELS.documentation) as Array<
    keyof typeof SIDEBAR_GROUP_LABELS.documentation
  >) {
    assertNonEmptyLabel(
      `explorer.documentationGroups.${id}`,
      (documentationGroups as Record<string, unknown>)[id],
    );
  }

  for (const id of Object.keys(
    DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
  ) as Array<keyof typeof DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS>) {
    assertNonEmptyLabel(
      `explorer.documentationSecondaries.${id}`,
      (documentationSecondaries as Record<string, unknown>)[id],
    );
  }
}

export function resolveExplorerMessages(
  messages: UiMessages,
): ExplorerMessages {
  assertExplorerMessages(messages.explorer);
  return messages.explorer;
}

/** Default-locale English folder label → collection id for overlay rewrites. */
export function buildDefaultFolderLabelToIdMap(): Map<
  string,
  keyof typeof FACTORY_EXPLORER_FOLDER_LABELS
> {
  return new Map(
    (
      Object.entries(FACTORY_EXPLORER_FOLDER_LABELS) as Array<
        [keyof typeof FACTORY_EXPLORER_FOLDER_LABELS, string]
      >
    ).map(([id, label]) => [label, id]),
  );
}

/**
 * Default-locale English subgroup separator label → localized label resolver.
 * Glossary group labels are left unchanged (Glossary is not an explorer folder).
 */
export function buildDefaultGroupLabelLocalizer(
  explorer: ExplorerMessages,
): Map<string, string> {
  const localized = new Map<string, string>();

  for (const [id, defaultLabel] of Object.entries(
    SIDEBAR_GROUP_LABELS.concepts,
  ) as Array<[keyof ExplorerMessages["conceptsGroups"], string]>) {
    localized.set(defaultLabel, explorer.conceptsGroups[id]);
  }

  for (const [id, defaultLabel] of Object.entries(
    SIDEBAR_GROUP_LABELS.documentation,
  ) as Array<[keyof ExplorerMessages["documentationGroups"], string]>) {
    localized.set(defaultLabel, explorer.documentationGroups[id]);
  }

  return localized;
}

/**
 * Default-locale English Program documentation secondary folder label →
 * localized label. Covers the locked Operations → Configuring secondary.
 */
export function buildDefaultSecondaryLabelLocalizer(
  explorer: ExplorerMessages,
): Map<string, string> {
  const localized = new Map<string, string>();

  for (const [id, defaultLabel] of Object.entries(
    DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS,
  ) as Array<[keyof ExplorerMessages["documentationSecondaries"], string]>) {
    localized.set(defaultLabel, explorer.documentationSecondaries[id]);
  }

  return localized;
}
