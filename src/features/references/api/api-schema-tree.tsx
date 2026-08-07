"use client";

/**
 * Recursive JSON Schema field renderer for `/docs/references/api`.
 *
 * Resolves `#/components/schemas/*` pointers against the shipped OpenAPI
 * document at render time, so a schema referenced by many operations is
 * transported once and expanded where it is read. This replaces server-rendered
 * Fumadocs Schema UI, which inlined the full field tree into HTML for every
 * operation and every locale.
 *
 * Nested objects render collapsed behind `<details>`: readers get the top-level
 * field list immediately, and depth is paid for only when opened. That also
 * bounds recursive schemas — `Factory` referencing itself expands one level per
 * interaction rather than looping.
 */

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Marker on the schema-tree root so probes can find rendered field structure. */
export const API_SCHEMA_TREE_ATTR = "data-api-schema-tree" as const;

/** Marker on each rendered property row, valued with the property name. */
export const API_SCHEMA_FIELD_ATTR = "data-api-schema-field" as const;

/**
 * Depth at which the tree stops auto-expanding and defers to `<details>`.
 * Level 0 (the root object's own properties) always renders open.
 */
export const API_SCHEMA_TREE_INLINE_DEPTH = 1;

export type JsonSchemaLike = {
  $ref?: string;
  type?: string | string[];
  format?: string;
  description?: string;
  enum?: unknown[];
  properties?: Record<string, JsonSchemaLike>;
  required?: string[];
  items?: JsonSchemaLike;
  oneOf?: JsonSchemaLike[];
  anyOf?: JsonSchemaLike[];
  allOf?: JsonSchemaLike[];
  additionalProperties?: boolean | JsonSchemaLike;
  nullable?: boolean;
  deprecated?: boolean;
};

export type ApiSchemaComponents = Readonly<Record<string, JsonSchemaLike>>;

const COMPONENT_SCHEMA_PREFIX = "#/components/schemas/";

/** Component name for a local schema pointer, or undefined when external. */
export function schemaComponentName(
  ref: string | undefined,
): string | undefined {
  if (typeof ref !== "string" || !ref.startsWith(COMPONENT_SCHEMA_PREFIX)) {
    return undefined;
  }
  const name = ref.slice(COMPONENT_SCHEMA_PREFIX.length).trim();
  return name.length > 0 ? name : undefined;
}

/**
 * Follow `$ref` chains to the concrete schema.
 *
 * Returns the last resolvable node and the component name that produced it, so
 * callers can label a field by its schema name while still rendering fields.
 * A pointer with no matching component resolves to `undefined` rather than an
 * invented placeholder.
 */
export function resolveSchemaRef(
  schema: JsonSchemaLike | undefined,
  components: ApiSchemaComponents,
): { schema: JsonSchemaLike | undefined; name: string | undefined } {
  let current = schema;
  let name: string | undefined;
  const seen = new Set<string>();

  while (current?.$ref !== undefined) {
    const componentName = schemaComponentName(current.$ref);
    if (componentName === undefined || seen.has(componentName)) {
      return { schema: undefined, name: componentName ?? name };
    }
    seen.add(componentName);
    name = componentName;
    current = components[componentName];
  }

  return { schema: current, name };
}

/** Compact `string`, `array of Foo`, `object` label for a resolved schema. */
export function schemaTypeLabel(
  schema: JsonSchemaLike | undefined,
  components: ApiSchemaComponents,
): string | undefined {
  if (schema === undefined) return undefined;

  const { schema: resolved, name } = resolveSchemaRef(schema, components);
  if (name !== undefined && resolved === undefined) return name;
  if (resolved === undefined) return undefined;

  if (resolved.type === "array") {
    const item = resolveSchemaRef(resolved.items, components);
    const itemLabel =
      item.name ??
      (Array.isArray(item.schema?.type)
        ? item.schema?.type.join(" | ")
        : item.schema?.type);
    return itemLabel !== undefined ? `array of ${itemLabel}` : "array";
  }

  if (name !== undefined) return name;

  if (Array.isArray(resolved.type)) return resolved.type.join(" | ");
  if (typeof resolved.type === "string") {
    return resolved.format !== undefined
      ? `${resolved.type} (${resolved.format})`
      : resolved.type;
  }

  if (resolved.oneOf !== undefined) return `oneOf (${resolved.oneOf.length})`;
  if (resolved.anyOf !== undefined) return `anyOf (${resolved.anyOf.length})`;
  if (resolved.allOf !== undefined) return `allOf (${resolved.allOf.length})`;
  if (resolved.properties !== undefined) return "object";
  return undefined;
}

/**
 * Merge `allOf` members into a single property view.
 *
 * OpenAPI generators routinely express "base plus extras" as `allOf`, and a
 * reader wants one field list rather than N partial ones.
 */
function flattenProperties(
  schema: JsonSchemaLike | undefined,
  components: ApiSchemaComponents,
  depth = 0,
): { properties: Record<string, JsonSchemaLike>; required: Set<string> } {
  const properties: Record<string, JsonSchemaLike> = {};
  const required = new Set<string>();
  if (schema === undefined || depth > 4) {
    return { properties, required };
  }

  const { schema: resolved } = resolveSchemaRef(schema, components);
  if (resolved === undefined) return { properties, required };

  for (const member of resolved.allOf ?? []) {
    const merged = flattenProperties(member, components, depth + 1);
    Object.assign(properties, merged.properties);
    for (const name of merged.required) required.add(name);
  }

  Object.assign(properties, resolved.properties ?? {});
  for (const name of resolved.required ?? []) required.add(name);

  return { properties, required };
}

function EnumValues({ values }: { values: readonly unknown[] }) {
  const shown = values.slice(0, 12);
  return (
    <p className="mt-1 flex flex-wrap gap-1 text-xs" data-api-schema-enum="">
      {shown.map((value) => (
        <code
          className="rounded border border-border px-1 py-0.5 font-mono text-muted-foreground"
          key={String(value)}
        >
          {String(value)}
        </code>
      ))}
      {values.length > shown.length ? (
        <span className="text-muted-foreground">
          +{values.length - shown.length} more
        </span>
      ) : null}
    </p>
  );
}

type SchemaFieldsProps = {
  schema: JsonSchemaLike | undefined;
  components: ApiSchemaComponents;
  depth: number;
  /** Component names already expanded on this branch — cycle guard. */
  ancestry: readonly string[];
};

function SchemaFields({
  schema,
  components,
  depth,
  ancestry,
}: SchemaFieldsProps) {
  const { properties, required } = flattenProperties(schema, components);
  const names = Object.keys(properties);
  if (names.length === 0) return null;

  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {names.map((name) => (
        <SchemaField
          ancestry={ancestry}
          components={components}
          depth={depth}
          key={name}
          name={name}
          required={required.has(name)}
          schema={properties[name] as JsonSchemaLike}
        />
      ))}
    </ul>
  );
}

function SchemaField({
  name,
  schema,
  components,
  depth,
  required,
  ancestry,
}: {
  name: string;
  schema: JsonSchemaLike;
  components: ApiSchemaComponents;
  depth: number;
  required: boolean;
  ancestry: readonly string[];
}) {
  const { schema: resolved, name: componentName } = resolveSchemaRef(
    schema,
    components,
  );
  // Arrays hide their shape one level down; expand the item so `items: Foo`
  // still offers Foo's fields rather than dead-ending at "array of Foo".
  const target =
    resolved?.type === "array"
      ? resolveSchemaRef(resolved.items, components)
      : { schema: resolved, name: componentName };

  const targetName = target.name;
  const cyclic = targetName !== undefined && ancestry.includes(targetName);
  const nested = flattenProperties(target.schema, components);
  const expandable = Object.keys(nested.properties).length > 0 && !cyclic;

  const label = schemaTypeLabel(schema, components);
  const description = resolved?.description ?? schema.description;

  return (
    <li
      className="min-w-0 rounded-md border border-border p-2"
      {...{ [API_SCHEMA_FIELD_ATTR]: name }}
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        <code className="font-mono text-sm text-foreground">{name}</code>
        {label !== undefined ? (
          <span
            className="font-mono text-muted-foreground text-xs"
            data-api-schema-field-type=""
          >
            {label}
          </span>
        ) : null}
        <span
          className={cn(
            "rounded-md border border-border px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide",
            required ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {required ? "required" : "optional"}
        </span>
        {resolved?.deprecated === true ? (
          <span className="rounded-md border border-border px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-muted-foreground uppercase">
            deprecated
          </span>
        ) : null}
      </div>

      {description !== undefined ? (
        <p className="mt-1 text-muted-foreground text-sm">{description}</p>
      ) : null}

      {resolved?.enum !== undefined ? (
        <EnumValues values={resolved.enum} />
      ) : null}

      {cyclic && targetName !== undefined ? (
        <p className="mt-1 text-muted-foreground text-xs">
          Recursive reference to <code className="font-mono">{targetName}</code>
          .
        </p>
      ) : null}

      {expandable ? (
        depth < API_SCHEMA_TREE_INLINE_DEPTH ? (
          <div className="mt-2 border-l border-border pl-3">
            <SchemaFields
              ancestry={
                targetName !== undefined ? [...ancestry, targetName] : ancestry
              }
              components={components}
              depth={depth + 1}
              schema={target.schema}
            />
          </div>
        ) : (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {Object.keys(nested.properties).length} field
              {Object.keys(nested.properties).length === 1 ? "" : "s"}
              {targetName !== undefined ? ` in ${targetName}` : ""}
            </summary>
            <div className="mt-2 border-l border-border pl-3">
              <SchemaFields
                ancestry={
                  targetName !== undefined
                    ? [...ancestry, targetName]
                    : ancestry
                }
                components={components}
                depth={depth + 1}
                schema={target.schema}
              />
            </div>
          </details>
        )
      ) : null}
    </li>
  );
}

export type ApiSchemaTreeProps = {
  /** Schema node, typically `{ $ref: "#/components/schemas/Foo" }`. */
  schema: JsonSchemaLike | undefined;
  components: ApiSchemaComponents;
  className?: string;
};

/**
 * Render one request/response schema as a readable field tree.
 *
 * Renders nothing when the schema publishes no fields — callers keep their own
 * type-summary chrome, and an empty tree must not imply an empty contract.
 */
export function ApiSchemaTree({
  schema,
  components,
  className,
}: ApiSchemaTreeProps) {
  const { name } = resolveSchemaRef(schema, components);
  const { properties } = flattenProperties(schema, components);
  const fieldCount = Object.keys(properties).length;

  if (fieldCount === 0) return null;

  return (
    <div
      className={cn("min-w-0 space-y-2", className)}
      {...{ [API_SCHEMA_TREE_ATTR]: name ?? "inline" }}
    >
      <SchemaFields
        ancestry={name !== undefined ? [name] : []}
        components={components}
        depth={0}
        schema={schema}
      />
    </div>
  );
}

/** Loaded OpenAPI document plus the derived component map. */
export type ApiOpenApiClientDocument = {
  document: Record<string, unknown>;
  components: ApiSchemaComponents;
};

export type ApiOpenApiFetchState =
  | { status: "loading" }
  | { status: "failed"; detail: string }
  | { status: "ready"; loaded: ApiOpenApiClientDocument };

/**
 * Read the shipped OpenAPI JSON once per mount.
 *
 * Kept as a hook (rather than a module singleton) so a failed fetch surfaces as
 * page state the reader can see, instead of a silently empty operations list.
 * `reload` re-runs the request after a transient network failure.
 */
export function useShippedOpenApiDocument(src: string): {
  state: ApiOpenApiFetchState;
  reload: () => void;
} {
  const [state, setState] = useState<ApiOpenApiFetchState>({
    status: "loading",
  });
  const [_attempt, setAttempt] = useState(0);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(src, { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return (await response.json()) as Record<string, unknown>;
      })
      .then((document) => {
        if (cancelled) return;
        const components =
          (document.components as { schemas?: ApiSchemaComponents } | undefined)
            ?.schemas ?? {};
        setState({ status: "ready", loaded: { document, components } });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      cancelled = true;
    };
    // `attempt` is the reload trigger; the fetch itself depends only on `src`.
  }, [src]);

  return { state, reload };
}
