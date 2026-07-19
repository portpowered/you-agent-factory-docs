/**
 * Page-local MDX components for references/api.
 * Merged by route-family-local-docs-page-load when this file is present.
 * Do not register these in the shared module MDX map.
 */
import { ApiReferenceProjection } from "./ApiReferenceProjection";
import {
  ApiReferenceProjectionHappyDomStub,
  isApiReferenceHappyDomUnitTestEnvironment,
} from "./ApiReferenceProjection.happy-dom";

export const pageMdxComponents = {
  ApiReferenceProjection: isApiReferenceHappyDomUnitTestEnvironment()
    ? ApiReferenceProjectionHappyDomStub
    : ApiReferenceProjection,
};
