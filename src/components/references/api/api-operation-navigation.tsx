/**
 * Responsive composition of desktop + mobile tag-grouped operation navigators.
 *
 * Desktop (`lg+`) shows {@link ApiOperationNavigator}; phone/tablet show
 * {@link ApiReferenceMobileNavigator} collapsed by default.
 */

import { cn } from "@/lib/utils";
import { ApiOperationNavigator } from "./api-operation-navigator";
import { ApiReferenceMobileNavigator } from "./api-reference-mobile-navigator";
import type {
  ApiOperationNavGroup,
  ApiOperationNavModel,
} from "./operation-navigation";

export type ApiOperationNavigationProps = {
  groups: readonly ApiOperationNavGroup[];
  model?: ApiOperationNavModel;
  className?: string;
  "data-testid"?: string;
};

/**
 * Tag-grouped operation navigation for the production API reference surface.
 */
export function ApiOperationNavigation({
  groups,
  model,
  className,
  "data-testid": testId = "api-operation-navigation",
}: ApiOperationNavigationProps) {
  return (
    <div
      className={cn("min-w-0", className)}
      data-testid={testId}
      data-api-operation-navigation=""
    >
      <ApiOperationNavigator
        className="hidden lg:block"
        groups={groups}
        model={model}
      />
      <ApiReferenceMobileNavigator
        className="lg:hidden"
        groups={groups}
        model={model}
      />
    </div>
  );
}
