import { useId } from "react";

type CheckboxProps = {
  checked: boolean;
  description?: string;
  disabled?: boolean;
  errorMessage?: string;
  label: string;
  name?: string;
  onCheckedChange: (checked: boolean) => void;
};

export function Checkbox({
  checked,
  description,
  disabled = false,
  errorMessage,
  label,
  name,
  onCheckedChange,
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = name ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div className="ui-checkbox">
      <label className="ui-checkbox__label" htmlFor={inputId}>
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={errorMessage ? "true" : undefined}
          checked={checked}
          className="ui-checkbox__input"
          disabled={disabled}
          id={inputId}
          name={name}
          onChange={(event) => onCheckedChange(event.currentTarget.checked)}
          type="checkbox"
        />
        <span className="ui-checkbox__text">{label}</span>
      </label>
      {description ? (
        <p className="ui-checkbox__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="ui-checkbox__error" id={errorId}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
