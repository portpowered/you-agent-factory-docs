import {
  DocsRouteChrome,
  type DocsRouteChromeProps,
} from "../../src/components/docs/docs-route-chrome";
import { FumadocsDocsLayout } from "../../src/components/docs/fumadocs-docs-layout";
import { renderWithLocalization } from "./render-with-localization";

type RenderDocsRouteOptions = Parameters<typeof renderWithLocalization>[1];

export function renderDocsRoute(
  props: DocsRouteChromeProps,
  options?: RenderDocsRouteOptions,
) {
  return renderWithLocalization(
    <FumadocsDocsLayout>
      <DocsRouteChrome {...props} />
    </FumadocsDocsLayout>,
    options,
  );
}
