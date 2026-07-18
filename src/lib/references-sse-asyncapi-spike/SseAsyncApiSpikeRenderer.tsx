"use client";

import type { AsyncAPI } from "@fumadocs/asyncapi";
import { createAsyncAPIPage } from "@fumadocs/asyncapi/ui";
import { defaultShikiFactory } from "fumadocs-core/highlight/shiki/full";

/**
 * Client boundary for `@fumadocs/asyncapi` — `createAsyncAPIPage` is a client
 * factory and cannot be invoked from a Server Component.
 */
const AsyncAPIPage = createAsyncAPIPage({
  shiki: defaultShikiFactory,
  shikiOptions: {
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  },
});

export type SseAsyncApiSpikeRendererProps = {
  bundled: AsyncAPI.AsyncAPIObject;
  operations: readonly { id: string; action: "receive" }[];
};

export function SseAsyncApiSpikeRenderer({
  bundled,
  operations,
}: SseAsyncApiSpikeRendererProps) {
  return (
    <AsyncAPIPage
      payload={{ bundled }}
      operations={[...operations]}
      showTitle
      showDescription
    />
  );
}
