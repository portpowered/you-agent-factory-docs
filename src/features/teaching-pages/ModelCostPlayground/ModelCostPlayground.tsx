"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TOKEN_FIELDS,
  derivePlaygroundCostState,
} from "./derive-playground-cost-state";
import { formatUsd } from "./format-usd";
import type { ModelCostPlaygroundProps, ModelCostTokenFields } from "./types";

const CONTROL_CLASS =
  "h-8 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ModelCostPlayground({
  models,
  defaultPrimaryModelId,
  defaultSecondaryModelId,
  messages,
  className,
}: ModelCostPlaygroundProps) {
  const reactId = useId();
  const [primaryModelId, setPrimaryModelId] = useState(defaultPrimaryModelId);
  const [secondaryModelId, setSecondaryModelId] = useState(
    defaultSecondaryModelId,
  );
  const [tokens, setTokens] =
    useState<ModelCostTokenFields>(DEFAULT_TOKEN_FIELDS);

  const costState = derivePlaygroundCostState({
    models,
    primaryModelId,
    secondaryModelId,
    tokens,
  });

  const primarySelectId = `${reactId}-primary`;
  const secondarySelectId = `${reactId}-secondary`;
  const controlsDisabled = models.length === 0;

  const statusMessage =
    costState.status === "empty"
      ? messages.emptyModelsMessage
      : costState.status === "error" && costState.reason === "missing-models"
        ? messages.missingModelMessage
        : costState.status === "error"
          ? messages.invalidTokensMessage
          : null;

  function updateTokenField(
    field: keyof ModelCostTokenFields,
    value: string,
  ): void {
    setTokens((current) => ({ ...current, [field]: value }));
  }

  return (
    <section
      aria-label={messages.totalLabel}
      className={cn("flex flex-col gap-4 text-foreground", className)}
      data-model-cost-playground=""
      data-state={costState.status}
    >
      <fieldset
        className="m-0 flex flex-col gap-3 rounded-md border border-border bg-muted/20 px-3 py-3 sm:flex-row sm:flex-wrap"
        data-model-selects=""
        disabled={controlsDisabled}
      >
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {messages.modelsLegend}
        </legend>

        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor={primarySelectId}
          >
            {messages.primaryLabel}
          </label>
          <select
            className={CONTROL_CLASS}
            disabled={controlsDisabled}
            id={primarySelectId}
            onChange={(event) => setPrimaryModelId(event.target.value)}
            value={primaryModelId}
          >
            {!models.some((model) => model.id === primaryModelId) ? (
              <option value={primaryModelId}>
                {messages.missingModelMessage}
              </option>
            ) : null}
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor={secondarySelectId}
          >
            {messages.secondaryLabel}
          </label>
          <select
            className={CONTROL_CLASS}
            disabled={controlsDisabled}
            id={secondarySelectId}
            onChange={(event) => setSecondaryModelId(event.target.value)}
            value={secondaryModelId}
          >
            {!models.some((model) => model.id === secondaryModelId) ? (
              <option value={secondaryModelId}>
                {messages.missingModelMessage}
              </option>
            ) : null}
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset
        className="m-0 grid gap-3 rounded-md border border-border bg-muted/20 px-3 py-3 sm:grid-cols-2"
        data-token-inputs=""
        disabled={controlsDisabled}
      >
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {messages.tokensLegend}
        </legend>

        <TokenNumberInput
          disabled={controlsDisabled}
          id={`${reactId}-planner-in`}
          label={messages.plannerInputLabel}
          onChange={(value) => updateTokenField("plannerInputTokens", value)}
          value={tokens.plannerInputTokens}
        />
        <TokenNumberInput
          disabled={controlsDisabled}
          id={`${reactId}-planner-out`}
          label={messages.plannerOutputLabel}
          onChange={(value) => updateTokenField("plannerOutputTokens", value)}
          value={tokens.plannerOutputTokens}
        />
        <TokenNumberInput
          disabled={controlsDisabled}
          id={`${reactId}-executor-in`}
          label={messages.executorInputLabel}
          onChange={(value) => updateTokenField("executorInputTokens", value)}
          value={tokens.executorInputTokens}
        />
        <TokenNumberInput
          disabled={controlsDisabled}
          id={`${reactId}-executor-out`}
          label={messages.executorOutputLabel}
          onChange={(value) => updateTokenField("executorOutputTokens", value)}
          value={tokens.executorOutputTokens}
        />
      </fieldset>

      {statusMessage ? (
        <p
          className="text-sm text-muted-foreground"
          data-playground-status=""
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

      {costState.status === "success" ? (
        <div
          aria-live="polite"
          className="flex flex-col gap-2 rounded-md border border-border px-3 py-3"
          data-cost-breakdown=""
          role="status"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {messages.breakdownLegend}
          </p>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">
                {messages.primaryOnlyLabel}
              </dt>
              <dd
                className="font-medium tabular-nums"
                data-primary-only-total=""
              >
                {formatUsd(costState.result.primaryOnly.totalUsd)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">
                {messages.splitTotalLabel}
              </dt>
              <dd className="font-medium tabular-nums" data-split-total="">
                {formatUsd(costState.result.split.totalUsd)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">
                {messages.plannerCostLabel}
              </dt>
              <dd className="font-medium tabular-nums" data-planner-cost="">
                {formatUsd(costState.result.split.planner.totalUsd)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">
                {messages.executorCostLabel}
              </dt>
              <dd className="font-medium tabular-nums" data-executor-cost="">
                {formatUsd(costState.result.split.executor.totalUsd)}
              </dd>
            </div>
          </dl>

          <p className="text-base font-semibold" data-total-r="">
            <span className="text-muted-foreground">
              {messages.totalLabel}:{" "}
            </span>
            <span data-total-r-value="">
              {formatUsd(
                Math.min(
                  costState.result.primaryOnly.totalUsd,
                  costState.result.split.totalUsd,
                ),
              )}
            </span>
          </p>
        </div>
      ) : null}
    </section>
  );
}

type TokenNumberInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};

function TokenNumberInput({
  id,
  label,
  value,
  onChange,
  disabled,
}: TokenNumberInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        className={CONTROL_CLASS}
        disabled={disabled}
        id={id}
        inputMode="decimal"
        min={0}
        onChange={(event) => onChange(event.target.value)}
        type="number"
        value={value}
      />
    </div>
  );
}
