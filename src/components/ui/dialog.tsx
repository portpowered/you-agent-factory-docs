"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { joinClassNames } from "@/lib/classnames";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

type DialogProps = {
  children: ReactNode;
  className?: string;
  closeLabel: string;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function Dialog({
  children,
  className,
  closeLabel,
  footer,
  onOpenChange,
  open,
  title,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    closeButtonRef.current?.focus() ?? panel.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="ui-dialog" role="presentation">
      <button
        aria-hidden="true"
        className="ui-dialog__backdrop"
        onClick={() => onOpenChange(false)}
        tabIndex={-1}
        type="button"
      />

      <dialog
        aria-labelledby={titleId}
        aria-modal="true"
        className={joinClassNames(
          "ui-dialog__panel ui-surface ui-surface--default ui-surface-radius--default ui-dialog__panel--wide border",
          className,
        )}
        open
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="ui-dialog__header">
          <div className="ui-dialog__header-copy">
            <h2 className="ui-dialog__title" id={titleId}>
              {title}
            </h2>
          </div>

          <Button
            aria-label={closeLabel}
            className="ui-dialog__close"
            onClick={() => onOpenChange(false)}
            ref={closeButtonRef}
            size="compact"
            variant="secondary"
          >
            <Icon decorative name="xMark" />
          </Button>
        </div>

        <div className="ui-dialog__body">{children}</div>

        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </dialog>
    </div>
  );
}

export function DialogFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={joinClassNames("ui-dialog__footer", className)}
      {...props}
    />
  );
}
