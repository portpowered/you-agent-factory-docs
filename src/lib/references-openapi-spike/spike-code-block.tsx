/**
 * OpenAPI spike code-block renderer used via createAPIPage `renderCodeBlock`.
 *
 * Server-side Shiki highlight with dual light/dark themes and the shared
 * `docs-code-block` marker so styling follows host semantic tokens rather than
 * page-only hard-coded colors. Keeps samples in static HTML (no client-only
 * DynamicCodeBlock gap on first paint).
 */

import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { cn } from "@/lib/utils";
import {
  SPIKE_CODE_BLOCK_ATTR,
  SPIKE_SHIKI_OPTIONS,
  SPIKE_TOKEN_CLASSES,
} from "./theme-customization";

type SpikeOpenApiCodeBlockProps = {
  lang: string;
  code: string;
};

export async function SpikeOpenApiCodeBlock({
  lang,
  code,
}: SpikeOpenApiCodeBlockProps) {
  return (
    <div {...{ [SPIKE_CODE_BLOCK_ATTR]: "" }}>
      <ServerCodeBlock
        lang={lang}
        code={code}
        themes={{ ...SPIKE_SHIKI_OPTIONS.themes }}
        defaultColor={SPIKE_SHIKI_OPTIONS.defaultColor}
        codeblock={{
          className: cn(
            "docs-code-block my-0 border",
            SPIKE_TOKEN_CLASSES.card,
            SPIKE_TOKEN_CLASSES.border,
          ),
        }}
      />
    </div>
  );
}
