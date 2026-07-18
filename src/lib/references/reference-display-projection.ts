/**
 * Display projection helpers for W04 normalized reference items.
 *
 * Pure, UI-agnostic renderer-oriented shapes — no React, Orama, filesystem, or
 * package resolution. Projections never mutate the canonical model input.
 */

import { anchorForIdentity } from "./reference-anchor-registry";
import type {
  ReferenceFamily,
  ReferenceItem,
  ReferenceLifecycle,
  ReferenceSourcePointer,
} from "./reference-item";
import type {
  SchemaAddress,
  SchemaConstraintsModel,
  SchemaDefinitionModel,
  SchemaFieldModel,
} from "./schema-model";

/**
 * A link a renderer can show (for example a `$ref` target or related anchor).
 * `href` is the owning-page fragment URL when known; otherwise only `anchor`.
 */
export type ReferenceDisplayLink = {
  label: string;
  /** URL fragment without `#`. */
  anchor: string;
  /** Full path+fragment (for example `/docs/references/api#Worker`). */
  href?: string;
  /** Target schema address when the link points at a schema node. */
  targetAddress?: SchemaAddress;
};

/**
 * Renderer-oriented projection of a normalized reference item or schema node.
 * Optional contract fields stay absent when the source omitted them.
 */
export type ReferenceDisplayProjection = {
  id: string;
  family: ReferenceFamily;
  title: string;
  description?: string;
  typeSummary?: string;
  constraints?: SchemaConstraintsModel;
  required?: boolean;
  nullable?: boolean;
  default?: unknown;
  enum?: unknown[];
  format?: string;
  /** URL fragment without `#`. */
  anchor: string;
  source: ReferenceSourcePointer;
  aliases: string[];
  links: ReferenceDisplayLink[];
  lifecycle?: ReferenceLifecycle;
};

export type ProjectReferenceItemToDisplayOptions = {
  typeSummary?: string;
  constraints?: SchemaConstraintsModel;
  required?: boolean;
  nullable?: boolean;
  default?: unknown;
  enum?: unknown[];
  format?: string;
  links?: readonly ReferenceDisplayLink[];
};

export type ProjectSchemaFieldToDisplayOptions = {
  id: string;
  family: ReferenceFamily;
  anchor: string;
  source: ReferenceSourcePointer;
  aliases?: readonly string[];
  links?: readonly ReferenceDisplayLink[];
  lifecycle?: ReferenceLifecycle;
  /**
   * Owning page path used to build link `href` values when a link only has an
   * anchor (for example `/docs/references/schema`).
   */
  pagePath?: string;
};

export type ProjectSchemaDefinitionToDisplayOptions = {
  id: string;
  family: ReferenceFamily;
  anchor: string;
  source: ReferenceSourcePointer;
  aliases?: readonly string[];
  links?: readonly ReferenceDisplayLink[];
  lifecycle?: ReferenceLifecycle;
  pagePath?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Shallow-clone a source pointer so projections cannot mutate the input. */
export function cloneReferenceSourcePointer(
  source: ReferenceSourcePointer,
): ReferenceSourcePointer {
  const cloned: ReferenceSourcePointer = {
    publicArtifactId: source.publicArtifactId,
    pointer: source.pointer,
  };
  if (source.path !== undefined) {
    cloned.path = source.path;
  }
  return cloned;
}

/** Shallow-clone a lifecycle block when present. */
export function cloneReferenceLifecycle(
  lifecycle: ReferenceLifecycle,
): ReferenceLifecycle {
  const cloned: ReferenceLifecycle = { state: lifecycle.state };
  if (lifecycle.since !== undefined) {
    cloned.since = lifecycle.since;
  }
  if (lifecycle.deprecated !== undefined) {
    cloned.deprecated = lifecycle.deprecated;
  }
  if (lifecycle.removed !== undefined) {
    cloned.removed = lifecycle.removed;
  }
  if (lifecycle.successorId !== undefined) {
    cloned.successorId = lifecycle.successorId;
  }
  return cloned;
}

/** Clone constraints as a fresh plain object (no shared mutable identity). */
export function cloneSchemaConstraints(
  constraints: SchemaConstraintsModel,
): SchemaConstraintsModel {
  return { ...constraints };
}

function cloneSchemaAddress(address: SchemaAddress): SchemaAddress {
  return {
    publicArtifactId: address.publicArtifactId,
    pointer: address.pointer,
  };
}

function cloneDisplayLink(link: ReferenceDisplayLink): ReferenceDisplayLink {
  const cloned: ReferenceDisplayLink = {
    label: link.label,
    anchor: link.anchor,
  };
  if (link.href !== undefined) {
    cloned.href = link.href;
  }
  if (link.targetAddress !== undefined) {
    cloned.targetAddress = cloneSchemaAddress(link.targetAddress);
  }
  return cloned;
}

function cloneLinks(
  links: readonly ReferenceDisplayLink[] | undefined,
): ReferenceDisplayLink[] {
  if (links === undefined || links.length === 0) {
    return [];
  }
  return links.map(cloneDisplayLink);
}

function cloneUnknownJson(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value) || isPlainObject(value)) {
    return JSON.parse(JSON.stringify(value)) as unknown;
  }
  return value;
}

function withPageHref(
  links: readonly ReferenceDisplayLink[],
  pagePath: string | undefined,
): ReferenceDisplayLink[] {
  if (pagePath === undefined) {
    return cloneLinks(links);
  }
  const base = pagePath.replace(/\/$/, "");
  return links.map((link) => {
    const cloned = cloneDisplayLink(link);
    if (cloned.href === undefined && cloned.anchor.length > 0) {
      cloned.href = `${base}#${cloned.anchor}`;
    }
    return cloned;
  });
}

/**
 * Project a shared `ReferenceItem` into a renderer-oriented display shape.
 * Returns a fresh object; does not mutate `item` or option payloads.
 */
export function projectReferenceItemToDisplay(
  item: ReferenceItem,
  options: ProjectReferenceItemToDisplayOptions = {},
): ReferenceDisplayProjection {
  const projection: ReferenceDisplayProjection = {
    id: item.id,
    family: item.family,
    title: item.title,
    anchor: item.anchor,
    source: cloneReferenceSourcePointer(item.source),
    aliases: [...item.aliases],
    links: cloneLinks(options.links),
    lifecycle: cloneReferenceLifecycle(item.lifecycle),
  };

  if (item.description !== undefined) {
    projection.description = item.description;
  }
  if (options.typeSummary !== undefined) {
    projection.typeSummary = options.typeSummary;
  }
  if (options.constraints !== undefined) {
    projection.constraints = cloneSchemaConstraints(options.constraints);
  }
  if (options.required !== undefined) {
    projection.required = options.required;
  }
  if (options.nullable !== undefined) {
    projection.nullable = options.nullable;
  }
  if (options.default !== undefined) {
    projection.default = cloneUnknownJson(options.default);
  }
  if (options.enum !== undefined) {
    projection.enum = cloneUnknownJson(options.enum) as unknown[];
  }
  if (options.format !== undefined) {
    projection.format = options.format;
  }

  return projection;
}

/**
 * Project a `SchemaFieldModel` into a display shape for field-tree renderers.
 */
export function projectSchemaFieldToDisplay(
  field: SchemaFieldModel,
  options: ProjectSchemaFieldToDisplayOptions,
): ReferenceDisplayProjection {
  const links = withPageHref(options.links ?? [], options.pagePath);

  if (field.refTarget !== undefined) {
    const refAnchor = anchorForIdentity(
      "schema-pointer",
      field.refTarget.pointer,
    );
    const alreadyLinked = links.some(
      (link) =>
        link.targetAddress?.publicArtifactId ===
          field.refTarget?.publicArtifactId &&
        link.targetAddress?.pointer === field.refTarget?.pointer,
    );
    if (!alreadyLinked) {
      const refLink: ReferenceDisplayLink = {
        label: field.refTarget.pointer,
        anchor: refAnchor,
        targetAddress: cloneSchemaAddress(field.refTarget),
      };
      if (options.pagePath !== undefined) {
        refLink.href = `${options.pagePath.replace(/\/$/, "")}#${refAnchor}`;
      }
      links.push(refLink);
    }
  }

  const projection: ReferenceDisplayProjection = {
    id: options.id,
    family: options.family,
    title: field.path,
    anchor: options.anchor,
    source: cloneReferenceSourcePointer(options.source),
    aliases: options.aliases !== undefined ? [...options.aliases] : [],
    links,
    required: field.required,
  };

  if (field.description !== undefined) {
    projection.description = field.description;
  }
  if (field.typeSummary !== undefined) {
    projection.typeSummary = field.typeSummary;
  }
  if (field.constraints !== undefined) {
    projection.constraints = cloneSchemaConstraints(field.constraints);
  }
  if (field.nullable !== undefined) {
    projection.nullable = field.nullable;
  }
  if (field.default !== undefined) {
    projection.default = cloneUnknownJson(field.default);
  }
  if (field.enum !== undefined) {
    projection.enum = cloneUnknownJson(field.enum) as unknown[];
  }
  if (field.format !== undefined) {
    projection.format = field.format;
  }
  if (options.lifecycle !== undefined) {
    projection.lifecycle = cloneReferenceLifecycle(options.lifecycle);
  }

  return projection;
}

/**
 * Project a `SchemaDefinitionModel` into a display shape for definition panels.
 */
export function projectSchemaDefinitionToDisplay(
  definition: SchemaDefinitionModel,
  options: ProjectSchemaDefinitionToDisplayOptions,
): ReferenceDisplayProjection {
  const title =
    definition.title ??
    definition.address.pointer.split("/").filter(Boolean).at(-1) ??
    definition.address.pointer;

  let typeSummary: string | undefined;
  if (definition.type !== undefined) {
    typeSummary = Array.isArray(definition.type)
      ? definition.type.join(" | ")
      : definition.type;
  }

  const projection: ReferenceDisplayProjection = {
    id: options.id,
    family: options.family,
    title,
    anchor: options.anchor,
    source: cloneReferenceSourcePointer(options.source),
    aliases: options.aliases !== undefined ? [...options.aliases] : [],
    links: withPageHref(options.links ?? [], options.pagePath),
  };

  if (definition.description !== undefined) {
    projection.description = definition.description;
  }
  if (typeSummary !== undefined) {
    projection.typeSummary = typeSummary;
  }
  if (definition.constraints !== undefined) {
    projection.constraints = cloneSchemaConstraints(definition.constraints);
  }
  if (definition.default !== undefined) {
    projection.default = cloneUnknownJson(definition.default);
  }
  if (definition.enum !== undefined) {
    projection.enum = cloneUnknownJson(definition.enum) as unknown[];
  }
  if (definition.format !== undefined) {
    projection.format = definition.format;
  }
  if (options.lifecycle !== undefined) {
    projection.lifecycle = cloneReferenceLifecycle(options.lifecycle);
  }

  return projection;
}
