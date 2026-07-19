/**
 * Production OpenAPI code-block renderer for `createAPIPage` `renderCodeBlock`.
 *
 * Server-side Shiki highlight with dual light/dark themes and the shared
 * `docs-code-block` marker so styling follows host semantic tokens rather than
 * page-only hard-coded colors.
 */

import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { cn } from "@/lib/utils";
import {
  API_CODE_PANEL_ATTR,
  API_SHIKI_OPTIONS,
  API_TOKEN_CLASSES,
} from "./theme-tokens";

export type ApiOpenApiCodeBlockProps = {
  lang: string;
  code: string;
};

export async function ApiOpenApiCodeBlock({
  lang,
  code,
}: ApiOpenApiCodeBlockProps) {
  return (
    <div {...{ [API_CODE_PANEL_ATTR]: "" }}>
      <ServerCodeBlock
        lang={lang}
        code={code}
        themes={{ ...API_SHIKI_OPTIONS.themes }}
        defaultColor={API_SHIKI_OPTIONS.defaultColor}
        codeblock={{
          className: cn(
            "docs-code-block my-0 border",
            API_TOKEN_CLASSES.card,
            API_TOKEN_CLASSES.border,
          ),
        }}
      />
    </div>
  );
}
