import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Callout } from "@/features/docs/components/Callout";
import { CitationList } from "@/features/docs/components/CitationList";
import { DerivedRelatedDocs } from "@/features/docs/components/DerivedRelatedDocs";
import { DocsPre } from "@/features/docs/components/DocsCodeBlock";
import { LocalizedLinkList } from "@/features/docs/components/LocalizedLinkList";
import { BlockMath, InlineMath } from "@/features/docs/components/Math";
import { PageAsset } from "@/features/docs/components/PageAsset";
import { PageMathFormula } from "@/features/docs/components/PageMathFormula";
import { RegistryAssociatedRecords } from "@/features/docs/components/RegistryAssociatedRecords";
import { RegistryDeepLinkList } from "@/features/docs/components/RegistryDeepLinkList";
import { RegistryLinkList } from "@/features/docs/components/RegistryLinkList";
import { RelatedDocs } from "@/features/docs/components/RelatedDocs";
import { Section } from "@/features/docs/components/Section";
import { T } from "@/features/docs/components/T";
import { TagPillList } from "@/features/docs/components/TagPillList";
import { GenerationEvolutionBlogVisual } from "@/features/generation-evolution/GenerationEvolutionBlogVisual";
import { GenerationEvolutionTimeline } from "@/features/generation-evolution/GenerationEvolutionTimeline";

export const moduleMdxComponents: MDXComponents = {
  ...defaultMdxComponents,
  pre: DocsPre,
  BlockMath,
  InlineMath,
  Callout,
  CitationList,
  DerivedRelatedDocs,
  LocalizedLinkList,
  PageAsset,
  RelatedDocs,
  RegistryAssociatedRecords,
  RegistryDeepLinkList,
  RegistryLinkList,
  Section,
  T,
  TagPillList,
  PageMathFormula,
  GenerationEvolutionBlogVisual,
  GenerationEvolutionTimeline,
};
