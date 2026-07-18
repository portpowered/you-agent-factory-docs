/**
 * W01 spike theme / customization inventory for Fumadocs OpenAPI.
 *
 * Records which createAPIPage hooks are supported vs blocked, and the
 * semantic token classes the spike uses so styling follows factory host
 * tokens (via fumadocs-ui shadcn.css → `--color-fd-*` → `--background` etc.)
 * instead of page-only hard-coded colors.
 */

/** Marker attribute on the spike page root for scoped theme CSS. */
export const SPIKE_THEME_ROOT_ATTR = "data-openapi-spike-theme" as const;

/** Marker on DocsCodeBlock / DynamicCodeBlock wrappers from renderCodeBlock. */
export const SPIKE_CODE_BLOCK_ATTR = "data-openapi-spike-codeblock" as const;

/** Marker on custom renderOperationLayout root. */
export const SPIKE_OPERATION_LAYOUT_ATTR =
  "data-openapi-spike-operation-layout" as const;

/** Marker on schema-bearing slots (request body / responses). */
export const SPIKE_SCHEMA_SLOT_ATTR = "data-openapi-spike-schema-slot" as const;

/** Marker on heading/header slot wrapper. */
export const SPIKE_HEADING_SLOT_ATTR =
  "data-openapi-spike-heading-slot" as const;

/** Tailwind / semantic classes that resolve through host factory tokens. */
export const SPIKE_TOKEN_CLASSES = {
  foreground: "text-foreground",
  mutedForeground: "text-muted-foreground",
  card: "bg-card text-card-foreground",
  border: "border-border",
  primary: "text-primary",
  muted: "bg-muted",
} as const;

/**
 * Shiki dual themes for OpenAPI code samples. `defaultColor: false` emits
 * CSS variables so light/dark follow `html.dark` (factory-dark host).
 */
export const SPIKE_SHIKI_OPTIONS = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
} as const;

export type SpikeCustomizationStatus =
  | "supported-exercised"
  | "supported-default-retained"
  | "blocked-unsupported";

export type SpikeCustomizationSurface = {
  surface: string;
  hook: string;
  status: SpikeCustomizationStatus;
  notes: string;
};

/**
 * Supported vs blocked customization surfaces for W01 findings / W08.
 * Keep this inventory machine-checkable; narrative lives under docs/temp.
 */
export const SPIKE_CUSTOMIZATION_SURFACES: readonly SpikeCustomizationSurface[] =
  [
    {
      surface: "page-layout",
      hook: "content.renderPageLayout",
      status: "supported-exercised",
      notes:
        "Wraps each operation in section[id=operationId] for deep links; uses token text classes.",
    },
    {
      surface: "operation-layout",
      hook: "content.renderOperationLayout",
      status: "supported-exercised",
      notes:
        "Two-column layout with token foreground/border classes and schema/heading slot markers.",
    },
    {
      surface: "code-block",
      hook: "renderCodeBlock",
      status: "supported-exercised",
      notes:
        "Renders ServerCodeBlock with docs-code-block markers + dual shiki themes (no page-only hex).",
    },
    {
      surface: "schema-ui",
      hook: "schemaUI.showExample",
      status: "supported-exercised",
      notes:
        "Enables schema examples; default SchemaUI retained (fd-* tokens via shadcn mapping).",
    },
    {
      surface: "schema-ui-render",
      hook: "schemaUI.render",
      status: "supported-default-retained",
      notes:
        "Full replace is supported but requires reimplementing schema walk; default SchemaUI kept for W01.",
    },
    {
      surface: "heading",
      hook: "renderHeading",
      status: "blocked-unsupported",
      notes:
        "Deprecated and unused in fumadocs-openapi 10.10.3; headings styled via scoped token CSS instead.",
    },
    {
      surface: "method-label",
      hook: "(internal MethodLabel)",
      status: "blocked-unsupported",
      notes:
        "Hard-coded Tailwind green/yellow/red/blue/orange; spike remaps via token CSS under SPIKE_THEME_ROOT_ATTR.",
    },
    {
      surface: "shiki-themes",
      hook: "shikiOptions",
      status: "supported-exercised",
      notes:
        "github-light + github-dark with defaultColor:false; host product is factory-dark (html.dark).",
    },
  ] as const;

export function listExercisedCustomizationHooks(): string[] {
  return SPIKE_CUSTOMIZATION_SURFACES.filter(
    (entry) => entry.status === "supported-exercised",
  ).map((entry) => entry.hook);
}

export function listBlockedCustomizationHooks(): string[] {
  return SPIKE_CUSTOMIZATION_SURFACES.filter(
    (entry) => entry.status === "blocked-unsupported",
  ).map((entry) => entry.hook);
}

/** True when a class string only references semantic token utilities (no hex). */
export function usesSemanticTokenClasses(className: string): boolean {
  if (/#[0-9a-fA-F]{3,8}\b/.test(className)) return false;
  if (/\brgb\(|\bhsl\(|\boklch\(/.test(className)) return false;
  return (
    className.includes("foreground") ||
    className.includes("border") ||
    className.includes("card") ||
    className.includes("primary") ||
    className.includes("muted") ||
    className.includes("docs-code-block")
  );
}
