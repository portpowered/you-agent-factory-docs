"use client";

import { joinClassNames } from "@/lib/classnames";
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

type DialogContextValue = {
  close: () => void;
  descriptionId: string;
  open: boolean;
  openDialog: () => void;
  titleId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(componentName: string): DialogContextValue {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error(`${componentName} must be used within Dialog.`);
  }

  return context;
}

type DialogProps = {
  children: ReactNode;
  defaultOpen?: boolean;
};

export function Dialog({ children, defaultOpen = false }: DialogProps) {
  const baseId = useId();
  const [open, setOpen] = useState(defaultOpen);

  const contextValue = useMemo<DialogContextValue>(
    () => ({
      close: () => setOpen(false),
      descriptionId: `${baseId}-description`,
      open,
      openDialog: () => setOpen(true),
      titleId: `${baseId}-title`,
    }),
    [baseId, open],
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  onClick,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const dialog = useDialogContext("DialogTrigger");

  return (
    <button
      aria-expanded={dialog.open}
      onClick={(event) => {
        dialog.openDialog();
        onClick?.(event);
      }}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"dialog">) {
  const dialog = useDialogContext("DialogContent");

  useEffect(() => {
    if (!dialog.open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dialog.close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialog]);

  if (!dialog.open) {
    return null;
  }

  return (
    <div
      className="ui-dialog fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-8 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          dialog.close();
        }
      }}
      role="presentation"
    >
      <dialog
        aria-describedby={dialog.descriptionId}
        aria-labelledby={dialog.titleId}
        className={joinClassNames(
          "ui-dialog-content grid w-full max-w-lg gap-4 rounded-2xl border bg-card p-6 shadow-xl",
          className,
        )}
        open
        {...props}
      >
        {children}
      </dialog>
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={joinClassNames("grid gap-1.5", className)} {...props} />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  const dialog = useDialogContext("DialogTitle");

  return (
    <h2
      className={joinClassNames(
        "m-0 text-lg font-semibold text-card-foreground",
        className,
      )}
      id={dialog.titleId}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  const dialog = useDialogContext("DialogDescription");

  return (
    <p
      className={joinClassNames(
        "m-0 text-sm/6 text-muted-foreground",
        className,
      )}
      id={dialog.descriptionId}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={joinClassNames(
        "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function DialogClose({
  children,
  onClick,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const dialog = useDialogContext("DialogClose");

  return (
    <button
      onClick={(event) => {
        dialog.close();
        onClick?.(event);
      }}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
