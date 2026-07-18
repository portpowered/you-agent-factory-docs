/**
 * Focused W07 verification surface for real package schemas.
 *
 * Renders SchemaReference against W04 models acquired via W03 public subpaths.
 * Not a final /docs/references/*-schema page — harness / demo only.
 */

"use client";

import { createReferenceCrossLinkResolver } from "@/lib/references/reference-cross-link-resolver";
import type {
  SchemaAddress,
  SchemaDefinitionModel,
} from "@/lib/references/schema-model";
import { createSchemaFieldModel } from "@/lib/references/schema-model";
import { cn } from "@/lib/utils";
import { SchemaFieldTree } from "./schema-field-tree";
import { SchemaReference } from "./schema-reference";
import type { SchemaFieldTreeNode } from "./types";

export type SchemaVerificationPackageView = {
  subpath: string;
  specifier: string;
  root: SchemaDefinitionModel;
  definitions: readonly SchemaDefinitionModel[];
  /** Optional addressed definition for composition / $ref proofs. */
  focusDefinition?: SchemaDefinitionModel;
};

export type SchemaVerificationHarnessProps = {
  packages: readonly SchemaVerificationPackageView[];
  pagePath?: string;
  className?: string;
  "data-testid"?: string;
};

const HARNESS_PAGE_PATH = "/schema-renderer-harness";

/**
 * Nested field tree used only to prove expand/collapse keyboard paths.
 * Real package schemas are `$ref`-heavy and correctly do not recurse.
 */
function buildKeyboardProbeFieldNodes(
  publicArtifactId: string,
): SchemaFieldTreeNode[] {
  return [
    {
      field: createSchemaFieldModel({
        path: "tools",
        address: {
          publicArtifactId,
          pointer: "/harness/keyboard-probe/properties/tools",
        },
        typeSummary: "object",
        required: true,
        description: "Harness nested object for expand/collapse proofs",
      }),
      children: [
        {
          field: createSchemaFieldModel({
            path: "tools.timeout",
            address: {
              publicArtifactId,
              pointer:
                "/harness/keyboard-probe/properties/tools/properties/timeout",
            },
            typeSummary: "number",
            required: false,
          }),
        },
      ],
    },
  ];
}

export function SchemaVerificationHarness({
  packages,
  pagePath = HARNESS_PAGE_PATH,
  className,
  "data-testid": testId = "schema-verification-harness",
}: SchemaVerificationHarnessProps) {
  const probeArtifact =
    packages[0]?.specifier ?? "@you-agent-factory/api/schemas/factory";

  return (
    <div
      className={cn(
        "mx-auto min-w-0 max-w-5xl space-y-10 px-4 py-6",
        className,
      )}
      data-schema-verification-harness=""
      data-testid={testId}
    >
      <header className="min-w-0 space-y-2">
        <p className="text-muted-foreground text-sm">
          Non-production schema renderer harness (W07)
        </p>
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">
          Shared JSON Schema renderer
        </h1>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Renders factory, you-config, and mock-workers schemas resolved through
          W03 public subpaths into W04 models and SchemaReference. Not a
          published reference page.
        </p>
      </header>

      <section
        aria-label="Keyboard expand probe"
        className="min-w-0 space-y-3 overflow-x-auto"
        data-schema-verification="keyboard-probe"
      >
        <h2 className="font-semibold text-foreground text-base">
          Keyboard expand probe
        </h2>
        <p className="text-muted-foreground text-sm">
          Nested fixture for expand/collapse keyboard proofs. Package schemas
          use `$ref` links instead of recursive expansion.
        </p>
        <SchemaFieldTree
          data-testid={`${testId}-keyboard-probe`}
          nodes={buildKeyboardProbeFieldNodes(probeArtifact)}
          pagePath={pagePath}
        />
      </section>

      {packages.map((entry) => {
        const resolver = createReferenceCrossLinkResolver({
          definitions: [entry.root, ...entry.definitions],
        });
        const resolve = (address: SchemaAddress) =>
          resolver.resolveRef({
            source: {
              publicArtifactId: address.publicArtifactId,
              pointer: address.pointer,
            },
            ref: address,
          });

        const showEmptyExamples = entry.subpath !== "schemas/mock-workers";

        return (
          <section
            aria-label={entry.specifier}
            className="min-w-0 space-y-6 overflow-x-auto"
            data-schema-verification-package={entry.subpath}
            key={entry.specifier}
          >
            <div className="min-w-0 space-y-1">
              <h2 className="font-semibold text-foreground text-lg">
                {entry.root.title ?? entry.subpath}
              </h2>
              <p className="break-all font-mono text-muted-foreground text-xs">
                {entry.specifier}
              </p>
            </div>

            <SchemaReference
              data-testid={`${testId}-${entry.subpath}`}
              definitions={entry.definitions}
              pagePath={pagePath}
              resolve={resolve}
              root={entry.root}
              showCatalog={false}
              showEmptyExamples={showEmptyExamples}
            />

            {entry.focusDefinition !== undefined ? (
              <SchemaReference
                address={entry.focusDefinition.address}
                data-testid={`${testId}-${entry.subpath}-focus`}
                definition={entry.focusDefinition}
                definitions={entry.definitions}
                pagePath={pagePath}
                resolve={resolve}
                root={entry.root}
                showCatalog={false}
                showFilter={false}
              />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
