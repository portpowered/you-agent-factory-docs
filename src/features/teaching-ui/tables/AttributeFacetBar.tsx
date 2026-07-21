"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { AttributeDef, AttributeFilterState } from "./types";

export type AttributeFacetBarProps = {
  attributeDefs: readonly AttributeDef[];
  filters: AttributeFilterState;
  onFiltersChange: (next: AttributeFilterState) => void;
  /**
   * Host-owned resolved labels keyed by attribute id.
   * When omitted for an id, the control falls back to `AttributeDef.labelKey`.
   */
  labels?: Readonly<Record<string, string>>;
  /** Accessible name for the facet region. */
  legend?: string;
  /**
   * Accessible empty indication when no filterable defs are present.
   * When omitted, the bar renders an empty region with no controls.
   */
  emptyMessage?: string;
  className?: string;
};

const CONTROL_CLASS =
  "h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

function resolveLabel(
  def: AttributeDef,
  labels: Readonly<Record<string, string>> | undefined,
): string {
  return labels?.[def.id] ?? def.labelKey;
}

function setBooleanFilter(
  filters: AttributeFilterState,
  attributeId: string,
  value: true | false | "any",
): AttributeFilterState {
  return {
    ...filters,
    boolean: {
      ...filters.boolean,
      [attributeId]: value,
    },
  };
}

function setStringFilter(
  filters: AttributeFilterState,
  attributeId: string,
  value: string,
): AttributeFilterState {
  return {
    ...filters,
    string: {
      ...filters.string,
      [attributeId]: value,
    },
  };
}

function setSingleTagFilter(
  filters: AttributeFilterState,
  attributeId: string,
  value: string | "any",
): AttributeFilterState {
  return {
    ...filters,
    singleTag: {
      ...filters.singleTag,
      [attributeId]: value,
    },
  };
}

function setMultiTagFilter(
  filters: AttributeFilterState,
  attributeId: string,
  selectedTags: string[],
): AttributeFilterState {
  return {
    ...filters,
    multiTag: {
      ...filters.multiTag,
      [attributeId]: selectedTags,
    },
  };
}

function parseBooleanSelectValue(raw: string): true | false | "any" {
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  return "any";
}

function toggleMultiTag(
  selected: readonly string[],
  tag: string,
  checked: boolean,
): string[] {
  if (checked) {
    if (selected.includes(tag)) {
      return [...selected];
    }
    return [...selected, tag];
  }
  return selected.filter((entry) => entry !== tag);
}

function BooleanFacetControl({
  def,
  label,
  value,
  controlId,
  onChange,
}: {
  def: AttributeDef;
  label: string;
  value: true | false | "any";
  controlId: string;
  onChange: (next: true | false | "any") => void;
}) {
  return (
    <div className="flex min-w-[10rem] flex-col gap-1">
      <label
        className="text-xs font-medium text-muted-foreground"
        htmlFor={controlId}
      >
        {label}
      </label>
      <select
        className={CONTROL_CLASS}
        data-attribute-facet={def.id}
        data-attribute-facet-type="boolean"
        id={controlId}
        onChange={(event) =>
          onChange(parseBooleanSelectValue(event.target.value))
        }
        value={value === "any" ? "any" : value ? "true" : "false"}
      >
        <option value="any">Any</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    </div>
  );
}

function StringFacetControl({
  def,
  label,
  value,
  controlId,
  onChange,
}: {
  def: AttributeDef;
  label: string;
  value: string;
  controlId: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
      <label
        className="text-xs font-medium text-muted-foreground"
        htmlFor={controlId}
      >
        {label}
      </label>
      <input
        className={cn(CONTROL_CLASS, "px-2.5")}
        data-attribute-facet={def.id}
        data-attribute-facet-type="string"
        id={controlId}
        onChange={(event) => onChange(event.target.value)}
        type="search"
        value={value}
      />
    </div>
  );
}

function SingleTagFacetControl({
  def,
  label,
  value,
  controlId,
  onChange,
}: {
  def: AttributeDef;
  label: string;
  value: string | "any";
  controlId: string;
  onChange: (next: string | "any") => void;
}) {
  const options = def.tagEnum ?? [];
  return (
    <div className="flex min-w-[10rem] flex-col gap-1">
      <label
        className="text-xs font-medium text-muted-foreground"
        htmlFor={controlId}
      >
        {label}
      </label>
      <select
        className={CONTROL_CLASS}
        data-attribute-facet={def.id}
        data-attribute-facet-type="single-tag"
        id={controlId}
        onChange={(event) =>
          onChange(event.target.value === "any" ? "any" : event.target.value)
        }
        value={value}
      >
        <option value="any">Any</option>
        {options.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
    </div>
  );
}

function MultiTagFacetControl({
  def,
  label,
  selected,
  groupId,
  onChange,
}: {
  def: AttributeDef;
  label: string;
  selected: readonly string[];
  groupId: string;
  onChange: (next: string[]) => void;
}) {
  const options = def.tagEnum ?? [];
  return (
    <fieldset
      className="m-0 flex min-w-[12rem] flex-col gap-1 border-0 p-0"
      data-attribute-facet={def.id}
      data-attribute-facet-type="multi-tag"
    >
      <legend className="px-0 text-xs font-medium text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-col gap-1">
        {options.map((tag) => {
          const checkboxId = `${groupId}-${tag}`;
          const checked = selected.includes(tag);
          return (
            <div className="flex items-center gap-2" key={tag}>
              <input
                checked={checked}
                className="size-4 accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-attribute-facet-tag={tag}
                id={checkboxId}
                onChange={(event) =>
                  onChange(toggleMultiTag(selected, tag, event.target.checked))
                }
                type="checkbox"
              />
              <label className="text-sm text-foreground" htmlFor={checkboxId}>
                {tag}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Keyboard-usable attribute facet controls for teaching-ui tables.
 * Renders only filterable defs. Host owns copy via `labels` / `labelKey`.
 * Multi-tag selections accumulate as `string[]` under `multiTag[attributeId]`
 * (AND semantics applied by `filterRowsByAttributes`).
 */
export function AttributeFacetBar({
  attributeDefs,
  filters,
  onFiltersChange,
  labels,
  legend = "Attribute filters",
  emptyMessage,
  className,
}: AttributeFacetBarProps) {
  const reactId = useId();
  const filterableDefs = attributeDefs.filter((def) => def.filterable);

  if (filterableDefs.length === 0) {
    return (
      <section
        aria-label={legend}
        className={cn(
          "rounded-md border border-border bg-muted/20 px-3 py-3",
          className,
        )}
        data-attribute-facet-bar=""
        data-attribute-facet-empty="true"
      >
        {emptyMessage ? (
          <p className="m-0 text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <fieldset
      className={cn(
        "m-0 flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-3 py-3",
        className,
      )}
      data-attribute-facet-bar=""
    >
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {legend}
      </legend>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        {filterableDefs.map((def) => {
          const label = resolveLabel(def, labels);
          const controlId = `${reactId}-${def.id}`;

          switch (def.type) {
            case "boolean":
              return (
                <BooleanFacetControl
                  controlId={controlId}
                  def={def}
                  key={def.id}
                  label={label}
                  onChange={(next) =>
                    onFiltersChange(setBooleanFilter(filters, def.id, next))
                  }
                  value={filters.boolean?.[def.id] ?? "any"}
                />
              );
            case "string":
              return (
                <StringFacetControl
                  controlId={controlId}
                  def={def}
                  key={def.id}
                  label={label}
                  onChange={(next) =>
                    onFiltersChange(setStringFilter(filters, def.id, next))
                  }
                  value={filters.string?.[def.id] ?? ""}
                />
              );
            case "single-tag":
              return (
                <SingleTagFacetControl
                  controlId={controlId}
                  def={def}
                  key={def.id}
                  label={label}
                  onChange={(next) =>
                    onFiltersChange(setSingleTagFilter(filters, def.id, next))
                  }
                  value={filters.singleTag?.[def.id] ?? "any"}
                />
              );
            case "multi-tag":
              return (
                <MultiTagFacetControl
                  def={def}
                  groupId={controlId}
                  key={def.id}
                  label={label}
                  onChange={(next) =>
                    onFiltersChange(setMultiTagFilter(filters, def.id, next))
                  }
                  selected={filters.multiTag?.[def.id] ?? []}
                />
              );
            default: {
              const _exhaustive: never = def.type;
              void _exhaustive;
              return null;
            }
          }
        })}
      </div>
    </fieldset>
  );
}
