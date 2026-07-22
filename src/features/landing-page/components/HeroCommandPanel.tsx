"use client";

import { Check, Clipboard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CODE_BLOCK_COPY_RESET_MS } from "@/features/code/CodeBlock";
import { cn } from "@/lib/utils";

export type HeroModelProvider = {
  id: string;
  label: string;
  /** Provider argument appended to the aspirational run command. */
  parameter: string;
};

export type HeroOperatingSystem = {
  id: "unix" | "windows";
  label: string;
  installCommand: string;
};

export type HeroCommandPanelProps = {
  installCommand: string;
  goalCommand: string;
  providers: readonly HeroModelProvider[];
  windowsInstallCommand?: string;
  className?: string;
};

export const HOMEPAGE_WINDOWS_INSTALL_COMMAND =
  "irm https://youagentfactory.com/install.ps1 | iex";

export function applyProviderParameter(
  command: string,
  parameter: string,
): string {
  const trimmedParameter = parameter.trim();
  if (trimmedParameter.length === 0) return command;
  return `${command.trim()} ${trimmedParameter}`;
}

/** Reference-shaped yellow command card with OS/provider pickers and copy. */
export function HeroCommandPanel({
  installCommand,
  goalCommand,
  providers,
  windowsInstallCommand = HOMEPAGE_WINDOWS_INSTALL_COMMAND,
  className,
}: HeroCommandPanelProps) {
  const defaultProvider = providers[0];
  const [activeProviderId, setActiveProviderId] = useState(
    defaultProvider?.id ?? "",
  );
  const [activeOsId, setActiveOsId] =
    useState<HeroOperatingSystem["id"]>("unix");
  const [copied, setCopied] = useState(false);
  const activeProvider = useMemo(
    () =>
      providers.find((provider) => provider.id === activeProviderId) ??
      defaultProvider,
    [activeProviderId, defaultProvider, providers],
  );
  const activeInstallCommand =
    activeOsId === "windows" ? windowsInstallCommand : installCommand;
  const activeGoalCommand = applyProviderParameter(
    goalCommand,
    activeProvider?.parameter ?? "",
  );
  const clipboardValue = `${activeInstallCommand} && ${activeGoalCommand}`;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(
      () => setCopied(false),
      CODE_BLOCK_COPY_RESET_MS,
    );
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyCommands() {
    try {
      await navigator.clipboard.writeText(clipboardValue);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const operatingSystems: readonly HeroOperatingSystem[] = [
    { id: "unix", label: "macOS/Linux", installCommand },
    {
      id: "windows",
      label: "Windows",
      installCommand: windowsInstallCommand,
    },
  ];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-sm bg-[#f3bd3d] px-4 py-3 text-[#191f2b] shadow-[7px_7px_0_rgba(25,31,43,0.2)] sm:px-5 sm:py-4",
        className,
      )}
      data-hero-command-panel=""
    >
      <div className="pr-10 font-sans text-[0.58rem] leading-none sm:text-[0.66rem]">
        <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-0 p-0">
          <legend className="sr-only">Choose an operating system</legend>
          {operatingSystems.map((operatingSystem) => {
            const selected = operatingSystem.id === activeOsId;
            return (
              <button
                key={operatingSystem.id}
                aria-pressed={selected}
                className={cn(
                  "rounded-[2px] border border-transparent px-0.5 py-0.5 transition-colors hover:border-[#191f2b]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191f2b]",
                  selected ? "font-black" : "text-[#191f2b]/55",
                )}
                data-install-os={operatingSystem.id}
                onClick={() => {
                  setActiveOsId(operatingSystem.id);
                  setCopied(false);
                }}
                type="button"
              >
                {operatingSystem.label}
              </button>
            );
          })}
        </fieldset>
      </div>

      <div
        className="mt-3 flex flex-col gap-1 font-sans text-[clamp(0.55rem,1.1vw,1rem)] leading-[1.18] font-medium tracking-[-0.03em]"
        data-command-rows=""
      >
        <code
          className="flex min-w-0 flex-nowrap items-baseline gap-x-2 whitespace-nowrap"
          data-command-row="install"
        >
          <span>{activeInstallCommand}</span>
          <span aria-hidden="true" data-command-operator="">
            &amp;&amp;
          </span>
          <span className="sr-only">and then</span>
        </code>
        <code className="break-words" data-command-row="goal">
          {activeGoalCommand}
        </code>
      </div>

      <fieldset className="m-0 mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-0 p-0 pr-10 font-sans text-[0.62rem] leading-none sm:text-xs">
        <legend className="sr-only">Choose a model provider</legend>
        {providers.map((provider) => {
          const selected = provider.id === activeProvider?.id;
          return (
            <button
              key={provider.id}
              aria-pressed={selected}
              className={cn(
                "rounded-[2px] border border-transparent px-0.5 py-0.5 transition-colors hover:border-[#191f2b]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191f2b]",
                selected ? "font-black" : "text-[#191f2b]/55",
              )}
              data-model-provider={provider.id}
              onClick={() => {
                setActiveProviderId(provider.id);
                setCopied(false);
              }}
              type="button"
            >
              {provider.label}
            </button>
          );
        })}
      </fieldset>

      <button
        aria-label={copied ? "Hero commands copied" : "Copy hero commands"}
        className="absolute top-3 right-3 grid size-8 place-items-center rounded-sm border border-transparent bg-transparent transition-colors hover:border-[#191f2b]/65 focus-visible:border-[#191f2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191f2b]"
        data-command-copy="all"
        onClick={() => void copyCommands()}
        type="button"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <Clipboard aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}
