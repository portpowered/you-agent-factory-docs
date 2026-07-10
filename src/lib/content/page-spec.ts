import { readFile } from "node:fs/promises";
import { z } from "zod";
import {
  conceptTypeSchema,
  ontologyRelationshipSchema,
  type PageFrontmatter,
  type PageKind,
  pageAssetConfigSchema,
  pageGraphMessagesSchema,
  pageTableMessagesSchema,
  registryStatusSchema,
} from "./schemas";

export const PAGE_SPEC_KINDS = ["concept", "glossary"] as const;

export type PageSpecKind = (typeof PAGE_SPEC_KINDS)[number];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const pageSpecSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
});

const pageSpecCalloutSchema = z.object({
  title: z.string().optional(),
  body: z.string().min(1),
});

const pageSpecAssetMessagesSchema = z.record(
  z.string(),
  z.object({
    alt: z.string().optional(),
    caption: z.string().optional(),
  }),
);

const pageSpecBaseSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(SLUG_PATTERN, "Use lowercase letters, digits, and single hyphens."),
  title: z.string().min(1),
  summary: z.string().min(1),
  status: registryStatusSchema.default("draft"),
  aliases: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  relatedIds: z.array(z.string()).default([]),
  citationIds: z.array(z.string()).default([]),
  sections: z.record(z.string(), pageSpecSectionSchema).optional(),
  callouts: z.record(z.string(), pageSpecCalloutSchema).optional(),
  assets: pageAssetConfigSchema.optional(),
  assetMessages: pageSpecAssetMessagesSchema.optional(),
  graph: pageGraphMessagesSchema.optional(),
  tables: z.record(z.string(), pageTableMessagesSchema).optional(),
});

const pageSpecOntologyShape = {
  primaryClassificationId: z.string().min(1).optional(),
  secondaryClassificationIds: z.array(z.string().min(1)).default([]),
  relationships: z.array(ontologyRelationshipSchema).default([]),
};

function hasOntologyTopology(input: {
  primaryClassificationId?: string;
  secondaryClassificationIds: string[];
  relationships: Array<unknown>;
}): boolean {
  return (
    input.primaryClassificationId !== undefined ||
    input.secondaryClassificationIds.length > 0 ||
    input.relationships.length > 0
  );
}

function collectOntologyFirstOrLegacyTypedFieldIssues(options: {
  legacyFieldLabel: string;
  legacyFieldValue: string | undefined;
  input: {
    primaryClassificationId?: string;
    secondaryClassificationIds: string[];
    relationships: Array<unknown>;
  };
}): PageSpecValidationIssue[] {
  const { legacyFieldLabel, legacyFieldValue, input } = options;
  const issues: PageSpecValidationIssue[] = [];

  if (
    input.primaryClassificationId === undefined &&
    (input.secondaryClassificationIds.length > 0 ||
      input.relationships.length > 0)
  ) {
    issues.push({
      field: "primaryClassificationId",
      message:
        "primaryClassificationId is required when secondaryClassificationIds or relationships are provided.",
    });
  }

  if (!legacyFieldValue && !hasOntologyTopology(input)) {
    issues.push({
      field: "primaryClassificationId",
      message: `Provide primaryClassificationId for ontology-first authoring or ${legacyFieldLabel} as a temporary compatibility field.`,
    });
  }

  return issues;
}

const conceptBackedPageSpecShape = {
  ...pageSpecOntologyShape,
  releaseDate: z.string().optional(),
  authors: z.array(z.string().min(1)).min(1).optional(),
  sourceId: z.string().min(1).optional(),
  conceptType: conceptTypeSchema.optional(),
  prerequisiteIds: z.array(z.string()).default([]),
  explainsIds: z.array(z.string()).default([]),
};

export const conceptPageSpecSchema = pageSpecBaseSchema.extend({
  kind: z.literal("concept"),
  ...conceptBackedPageSpecShape,
});

export const glossaryPageSpecSchema = pageSpecBaseSchema.extend({
  kind: z.literal("glossary"),
  ...conceptBackedPageSpecShape,
});

export const pageSpecSchema = z.discriminatedUnion("kind", [
  conceptPageSpecSchema,
  glossaryPageSpecSchema,
]);

export type ConceptPageSpec = z.infer<typeof conceptPageSpecSchema>;
export type GlossaryPageSpec = z.infer<typeof glossaryPageSpecSchema>;
export type PageSpec = z.infer<typeof pageSpecSchema>;

export type PageSpecValidationIssue = {
  field: string;
  message: string;
};

export type PageSpecWarning = {
  field: string;
  message: string;
};

type DeprecatedTaxonomyFieldWarningOptions = {
  field: string;
  recordKind: "concept" | "glossary";
  replacement: string;
};

function createDeprecatedTaxonomyFieldWarning(
  options: DeprecatedTaxonomyFieldWarningOptions,
): PageSpecWarning {
  const { field, recordKind, replacement } = options;
  return {
    field,
    message: `${field} is deprecated for ${recordKind} page specs. Use ${replacement} instead for ontology-first authoring.`,
  };
}

export function collectDeprecatedTaxonomyWarnings(
  spec: PageSpec,
): PageSpecWarning[] {
  switch (spec.kind) {
    case "concept":
    case "glossary":
      return spec.conceptType
        ? [
            createDeprecatedTaxonomyFieldWarning({
              field: "conceptType",
              recordKind: spec.kind,
              replacement:
                "primaryClassificationId plus optional secondaryClassificationIds and relationships",
            }),
          ]
        : [];
    default:
      return [];
  }
}

export class PageSpecValidationError extends Error {
  readonly issues: PageSpecValidationIssue[];

  constructor(issues: PageSpecValidationIssue[]) {
    const summary = issues
      .map((issue) => `${issue.field}: ${issue.message}`)
      .join("; ");
    super(`Invalid page spec: ${summary}`);
    this.name = "PageSpecValidationError";
    this.issues = issues;
  }
}

function formatZodPath(path: (string | number)[]): string {
  if (path.length === 0) {
    return "pageSpec";
  }
  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === "number") {
      return `${formatted}[${segment}]`;
    }
    return formatted.length === 0 ? segment : `${formatted}.${segment}`;
  }, "");
}

export function formatPageSpecValidationIssues(
  error: z.ZodError,
): PageSpecValidationIssue[] {
  return error.issues.map((issue) => ({
    field: formatZodPath(issue.path),
    message: issue.message,
  }));
}

export function validatePageSpec(input: unknown): PageSpec {
  const result = pageSpecSchema.safeParse(input);
  if (!result.success) {
    throw new PageSpecValidationError(
      formatPageSpecValidationIssues(result.error),
    );
  }

  const issues = collectPageSpecCompatibilityIssues(result.data);
  if (issues.length > 0) {
    throw new PageSpecValidationError(issues);
  }

  return result.data;
}

function collectPageSpecCompatibilityIssues(
  spec: PageSpec,
): PageSpecValidationIssue[] {
  const compatibilityIssues: PageSpecValidationIssue[] = [];
  const ontologyInput = {
    primaryClassificationId: spec.primaryClassificationId,
    secondaryClassificationIds: spec.secondaryClassificationIds,
    relationships: spec.relationships,
  };
  const addCompatibilityIssues = (
    legacyFieldLabel: string,
    legacyFieldValue: string | undefined,
  ) => {
    compatibilityIssues.push(
      ...collectOntologyFirstOrLegacyTypedFieldIssues({
        legacyFieldLabel,
        legacyFieldValue,
        input: ontologyInput,
      }),
    );
  };

  switch (spec.kind) {
    case "concept":
    case "glossary":
      addCompatibilityIssues("conceptType", spec.conceptType);
      break;
    default:
      break;
  }

  return compatibilityIssues;
}

export function parsePageSpecJson(raw: string): PageSpec {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new PageSpecValidationError([
      {
        field: "pageSpec",
        message:
          error instanceof Error
            ? `Invalid JSON: ${error.message}`
            : "Invalid JSON",
      },
    ]);
  }
  return validatePageSpec(parsed);
}

export async function parsePageSpecFile(path: string): Promise<PageSpec> {
  const raw = await readFile(path, "utf8");
  return parsePageSpecJson(raw);
}

const registryKindByPageKind: Record<PageSpecKind, "concept"> = {
  concept: "concept",
  glossary: "concept",
};

export function registryKindForPageSpec(
  spec: PageSpec,
): (typeof registryKindByPageKind)[PageSpecKind] {
  return registryKindByPageKind[spec.kind];
}

export function registryIdForPageSpec(spec: PageSpec): string {
  return `${registryKindForPageSpec(spec)}.${spec.slug}`;
}

export function pageKindForPageSpec(spec: PageSpec): PageKind {
  return spec.kind;
}

export function derivePageFrontmatter(
  spec: PageSpec,
  updatedAt: string,
): PageFrontmatter {
  const frontmatter: PageFrontmatter = {
    kind: pageKindForPageSpec(spec),
    registryId: registryIdForPageSpec(spec),
    messageNamespace: "local",
    assetNamespace: "local",
    tags: spec.tags,
    status: spec.status,
    updatedAt,
  };

  if (spec.aliases.length > 0) {
    frontmatter.aliases = spec.aliases;
  }

  return frontmatter;
}

export function deriveDefaultTitleKey(): "title" {
  return "title";
}

export function deriveDefaultSummaryKey(): "description" {
  return "description";
}
