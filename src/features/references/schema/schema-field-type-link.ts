/**
 * Resolve a field's type badge into a navigable target when it has one.
 *
 * A field whose type is a `$ref` publishes a bare composition keyword as its
 * type summary — `allOf` tells a reader nothing, and parking the real target on
 * a separate `$ref → NameValue` row below the description makes them read two
 * places to learn one fact. Name the target in the badge and make the badge the
 * link.
 *
 * The same holds for arrays: `WorkType[]` already names the item type, it just
 * was not clickable. Point it at the item schema.
 *
 * Fields with neither get a plain badge — this never mints a target the
 * contract did not publish.
 *
 * Pure — no React, no IO.
 */

import type { SchemaFieldModel } from "@/lib/references/schema-model";
import {
  type SchemaRefLinkDisplay,
  schemaRefCompactLabel,
  schemaRefLinkDisplayFromAddress,
} from "./schema-ref-display";

/**
 * Type summaries that name a composition keyword instead of a type. When a
 * field publishes one of these alongside a `$ref`, the target's name is the
 * useful label.
 */
const COMPOSITION_TYPE_SUMMARIES = new Set(["allOf", "anyOf", "oneOf", "$ref"]);

export type SchemaFieldTypeLink = {
  /** Navigable (or explicitly unresolved) display for the type badge. */
  display: SchemaRefLinkDisplay;
  /**
   * True when the link replaces the type summary outright (a `$ref` field).
   * False when it decorates a summary that already reads as a type (`Foo[]`).
   */
  replacesSummary: boolean;
};

/**
 * Build the type-badge link for one field.
 *
 * `refLink` takes precedence when supplied — it carries resolver outcomes
 * (cycle / missing / malformed) that an address alone cannot express, and those
 * must keep rendering as non-navigable unresolved chrome.
 */
export function schemaFieldTypeLink(
  field: SchemaFieldModel,
  options: {
    pagePath?: string;
    /** Pre-resolved outcome for the field's `$ref`, when the caller has one. */
    refLink?: SchemaRefLinkDisplay;
    /** When true, keep full-pointer labels instead of leaf names. */
    showPointerPathChrome?: boolean;
  } = {},
): SchemaFieldTypeLink | undefined {
  const { pagePath, refLink, showPointerPathChrome = false } = options;
  const label = (pointer: string) =>
    showPointerPathChrome ? pointer : schemaRefCompactLabel(pointer);

  if (refLink !== undefined) {
    return { display: refLink, replacesSummary: true };
  }

  const refTarget = field.refTarget;
  if (refTarget !== undefined) {
    return {
      display: schemaRefLinkDisplayFromAddress(refTarget, {
        pagePath,
        label: label(refTarget.pointer),
      }),
      replacesSummary: true,
    };
  }

  const itemSchema = field.itemSchema;
  if (itemSchema !== undefined) {
    // `WorkType[]` already names the item; keep it and only add the target.
    // Fall back to `WorkType[]` when the contract published no summary.
    const summary =
      field.typeSummary !== undefined &&
      !COMPOSITION_TYPE_SUMMARIES.has(field.typeSummary)
        ? field.typeSummary
        : `${label(itemSchema.pointer)}[]`;
    return {
      display: schemaRefLinkDisplayFromAddress(itemSchema, {
        pagePath,
        label: summary,
      }),
      replacesSummary: true,
    };
  }

  return undefined;
}
