/**
 * Pure display projectors for `$ref`, composition, and discriminator links.
 *
 * Converts W04 addresses / ReferenceCrossLinkResolver outcomes into renderer
 * shapes. Never invents missing definitions or expands cyclic graphs.
 */

import { anchorForIdentity } from "@/lib/references/reference-anchor-registry";
import type { ReferenceCrossLinkOutcome } from "@/lib/references/reference-cross-link-resolver";
import {
  createSchemaAddress,
  type SchemaAddress,
  type SchemaCompositionKind,
  type SchemaCompositionModel,
  type SchemaDiscriminatorModel,
} from "@/lib/references/schema-model";

export type SchemaRefLinkKind = "resolved" | "cycle" | "missing" | "malformed";

/**
 * Renderer-ready `$ref` / cross-link display. Navigable when `href` or `anchor`
 * is present (resolved + cycle). Missing/malformed stay non-navigable.
 */
export type SchemaRefLinkDisplay = {
  kind: SchemaRefLinkKind;
  /** Visible label (typically the JSON Pointer). */
  label: string;
  targetAddress?: SchemaAddress;
  /** URL fragment without `#` when a stable W04 anchor can be derived. */
  anchor?: string;
  /** Full path+fragment when a page path was supplied. */
  href?: string;
  /** Extra accessible detail (cycle path, missing target, malformed message). */
  detail?: string;
};

export type SchemaCompositionBranchDisplay = {
  kind: SchemaCompositionKind;
  members: SchemaRefLinkDisplay[];
};

export type SchemaDiscriminatorMappingDisplay = {
  value: string;
  link: SchemaRefLinkDisplay;
};

export type SchemaDiscriminatorDisplay = {
  propertyName: string;
  mappings: SchemaDiscriminatorMappingDisplay[];
};

export type SchemaCompositionDisplay = {
  branches: SchemaCompositionBranchDisplay[];
  discriminator?: SchemaDiscriminatorDisplay;
};

function cloneAddress(address: SchemaAddress): SchemaAddress {
  return createSchemaAddress(address);
}

function schemaPointerAnchor(pointer: string): string {
  return anchorForIdentity("schema-pointer", pointer);
}

function hrefForAnchor(
  anchor: string,
  pagePath: string | undefined,
): string | undefined {
  if (pagePath === undefined || pagePath.trim().length === 0) {
    return undefined;
  }
  return `${pagePath.replace(/\/$/, "")}#${anchor}`;
}

function leafPointerLabel(pointer: string): string {
  const segments = pointer.split("/").filter((segment) => segment.length > 0);
  return segments[segments.length - 1] ?? pointer;
}

/**
 * Build a navigable link display from a known schema address (stable W04
 * anchor). Use when the caller already holds an address and does not need
 * catalog/cycle resolution for this hop.
 */
export function schemaRefLinkDisplayFromAddress(
  address: SchemaAddress,
  options: {
    pagePath?: string;
    kind?: "resolved" | "cycle";
    detail?: string;
    label?: string;
  } = {},
): SchemaRefLinkDisplay {
  const target = cloneAddress(address);
  const anchor = schemaPointerAnchor(target.pointer);
  const href = hrefForAnchor(anchor, options.pagePath);
  const display: SchemaRefLinkDisplay = {
    kind: options.kind ?? "resolved",
    label: options.label ?? target.pointer,
    targetAddress: target,
    anchor,
  };
  if (href !== undefined) {
    display.href = href;
  }
  if (options.detail !== undefined) {
    display.detail = options.detail;
  }
  return display;
}

/**
 * Project a W04 cross-link outcome into a ref-link display.
 * Cycles remain links (to the re-entered address) with an explicit cycle
 * sentinel; missing/malformed are unresolved and non-navigable.
 */
export function schemaRefLinkDisplayFromOutcome(
  outcome: ReferenceCrossLinkOutcome,
  options: { pagePath?: string } = {},
): SchemaRefLinkDisplay {
  switch (outcome.kind) {
    case "resolved": {
      return schemaRefLinkDisplayFromAddress(outcome.target, {
        pagePath: options.pagePath,
        kind: "resolved",
        label: outcome.target.pointer,
      });
    }
    case "cycle": {
      const cycleTarget = outcome.cycleAt;
      const pathLabels = outcome.path.map((entry) => entry.pointer).join(" → ");
      return schemaRefLinkDisplayFromAddress(cycleTarget, {
        pagePath: options.pagePath,
        kind: "cycle",
        label: cycleTarget.pointer,
        detail: `Cycle at ${cycleTarget.pointer}${pathLabels.length > 0 ? ` (${pathLabels})` : ""}`,
      });
    }
    case "missing": {
      return {
        kind: "missing",
        label: outcome.target.pointer,
        targetAddress: cloneAddress(outcome.target),
        detail: `Unresolved $ref: ${outcome.target.pointer} is not in the schema catalog.`,
      };
    }
    case "malformed": {
      return {
        kind: "malformed",
        label: outcome.rawRef ?? "malformed $ref",
        detail: outcome.message,
      };
    }
  }
}

function projectBranchMembers(
  addresses: readonly SchemaAddress[] | undefined,
  kind: SchemaCompositionKind,
  options: {
    resolve?: (address: SchemaAddress) => ReferenceCrossLinkOutcome;
    pagePath?: string;
  },
): SchemaCompositionBranchDisplay | undefined {
  if (addresses === undefined || addresses.length === 0) {
    return undefined;
  }

  const members = addresses.map((address) => {
    if (options.resolve !== undefined) {
      return schemaRefLinkDisplayFromOutcome(options.resolve(address), {
        pagePath: options.pagePath,
      });
    }
    return schemaRefLinkDisplayFromAddress(address, {
      pagePath: options.pagePath,
      label: address.pointer,
    });
  });

  return { kind, members };
}

/**
 * Project a discriminator block into labeled mapping rows with link displays.
 */
export function projectSchemaDiscriminatorDisplay(
  discriminator: SchemaDiscriminatorModel,
  options: {
    resolve?: (address: SchemaAddress) => ReferenceCrossLinkOutcome;
    pagePath?: string;
  } = {},
): SchemaDiscriminatorDisplay {
  const mapping = discriminator.mapping ?? {};
  const mappings: SchemaDiscriminatorMappingDisplay[] = Object.entries(
    mapping,
  ).map(([value, address]) => {
    const link =
      options.resolve !== undefined
        ? schemaRefLinkDisplayFromOutcome(options.resolve(address), {
            pagePath: options.pagePath,
          })
        : schemaRefLinkDisplayFromAddress(address, {
            pagePath: options.pagePath,
            label: address.pointer,
          });
    return { value, link };
  });

  return {
    propertyName: discriminator.propertyName,
    mappings,
  };
}

/**
 * Project a composition model into labeled oneOf/anyOf/allOf branches plus
 * optional discriminator mappings. Members stay as links — never recursive
 * definition trees.
 */
export function projectSchemaCompositionDisplay(
  composition: SchemaCompositionModel,
  options: {
    resolve?: (address: SchemaAddress) => ReferenceCrossLinkOutcome;
    pagePath?: string;
  } = {},
): SchemaCompositionDisplay {
  const branches: SchemaCompositionBranchDisplay[] = [];

  for (const kind of ["oneOf", "anyOf", "allOf"] as const) {
    const branch = projectBranchMembers(composition[kind], kind, options);
    if (branch !== undefined) {
      branches.push(branch);
    }
  }

  const display: SchemaCompositionDisplay = { branches };

  if (composition.discriminator !== undefined) {
    display.discriminator = projectSchemaDiscriminatorDisplay(
      composition.discriminator,
      options,
    );
  }

  return display;
}

/** Accessible composition-kind label for UI headings. */
export function schemaCompositionKindLabel(
  kind: SchemaCompositionKind,
): string {
  switch (kind) {
    case "oneOf":
      return "oneOf";
    case "anyOf":
      return "anyOf";
    case "allOf":
      return "allOf";
  }
}

/** Short human title for a pointer (last segment) when a compact label helps. */
export function schemaRefCompactLabel(pointer: string): string {
  return leafPointerLabel(pointer);
}
