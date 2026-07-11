"use client";

import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import {
  Children,
  type ComponentProps,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  DOCS_CODE_COPY_BUTTON_CLASS,
  DOCS_CODE_COPY_CONTROL_ATTR,
  DOCS_CODE_COPY_CONTROL_VALUE,
} from "@/features/docs/styles/docs-code-copy-chrome";
import { cn } from "@/lib/utils";

type DocsCodeBlockProps = ComponentProps<typeof CodeBlock>;

/** Horizontal inset for fenced code text (left and right). */
export const DOCS_CODE_BLOCK_INSET_INLINE = "1rem";

type DocsCodeBlockActionsProps = {
  className?: string;
  children?: ReactNode;
};

type CopyControlChildProps = {
  className?: string;
  [DOCS_CODE_COPY_CONTROL_ATTR]?: string;
};

/**
 * Mark Fumadocs CopyButton children so host CSS can keep them visible and
 * apply secondary-blue hover/focus without rewriting page MDX.
 */
function markCopyControlChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const element = child as ReactElement<CopyControlChildProps>;
    return cloneElement(element, {
      className: cn(element.props.className, DOCS_CODE_COPY_BUTTON_CLASS),
      [DOCS_CODE_COPY_CONTROL_ATTR]: DOCS_CODE_COPY_CONTROL_VALUE,
    });
  });
}

/**
 * Fumadocs passes absolute overlay classes for untitled blocks. Replace that
 * overlay with a dedicated rail so horizontal scroll never paints under the
 * copy control. Title-bar actions keep their in-flow placement.
 */
function DocsCodeBlockActions({
  className,
  children,
}: DocsCodeBlockActionsProps) {
  const isOverlay = className?.includes("absolute") ?? false;
  const markedChildren = markCopyControlChildren(children);

  if (!isOverlay) {
    return (
      <div
        data-docs-code-actions="title"
        className={cn("empty:hidden", className)}
      >
        {markedChildren}
      </div>
    );
  }

  return (
    <div
      data-docs-code-actions="rail"
      className="docs-code-block__actions empty:hidden text-fd-muted-foreground"
    >
      {markedChildren}
    </div>
  );
}

/** Fumadocs fenced-code wrapper with inset padding and a non-overlapping copy rail. */
export function DocsCodeBlock({
  viewportProps,
  children,
  className,
  Actions,
  ...props
}: DocsCodeBlockProps) {
  const viewportStyle = {
    // Inset lives on the viewport so plain <pre> and .line rows share one edge.
    // Zero shiki line padding vars to avoid double horizontal inset.
    "--padding-left": "0px",
    "--padding-right": "0px",
    paddingInline: DOCS_CODE_BLOCK_INSET_INLINE,
    ...viewportProps?.style,
  } as CSSProperties;

  return (
    <CodeBlock
      {...props}
      className={cn("docs-code-block", className)}
      Actions={Actions ?? DocsCodeBlockActions}
      viewportProps={
        {
          ...viewportProps,
          "data-rich-content-scroll": "code",
          className: cn("docs-code-block__viewport", viewportProps?.className),
          style: viewportStyle,
        } as DocsCodeBlockProps["viewportProps"]
      }
    >
      {children}
    </CodeBlock>
  );
}

/** MDX `pre` mapping that preserves Fumadocs copy affordances and scroll region. */
export function DocsPre(props: DocsCodeBlockProps) {
  return (
    <DocsCodeBlock {...props}>
      <Pre>{props.children}</Pre>
    </DocsCodeBlock>
  );
}
