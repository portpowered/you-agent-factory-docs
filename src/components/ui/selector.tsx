import { Icon, type IconName } from "@/components/ui/icon";
import { useId } from "react";

export type SelectorOption<T extends string> = {
  description?: string;
  disabled?: boolean;
  iconName?: IconName;
  label: string;
  value: T;
};

type SelectorProps<T extends string> = {
  description?: string;
  label: string;
  name?: string;
  onValueChange: (value: T) => void;
  options: readonly SelectorOption<T>[];
  value: T;
};

export function Selector<T extends string>({
  description,
  label,
  name,
  onValueChange,
  options,
  value,
}: SelectorProps<T>) {
  const generatedId = useId();
  const groupName = name ?? generatedId;
  const descriptionId = description ? `${groupName}-description` : undefined;

  return (
    <fieldset
      aria-describedby={descriptionId}
      className="ui-selector"
      role="radiogroup"
    >
      <legend className="ui-selector__legend">{label}</legend>
      {description ? (
        <p className="ui-selector__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <div className="ui-selector__group">
        {options.map((option) => {
          const optionId = `${groupName}-${option.value}`;

          return (
            <label
              className="ui-selector__option"
              htmlFor={optionId}
              key={option.value}
            >
              <input
                checked={option.value === value}
                className="ui-selector__input"
                disabled={option.disabled}
                id={optionId}
                name={groupName}
                onChange={() => onValueChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span className="ui-selector__control">
                {option.iconName ? (
                  <Icon className="ui-selector__icon" name={option.iconName} />
                ) : null}
                <span className="ui-selector__copy">
                  <span className="ui-selector__label">{option.label}</span>
                  {option.description ? (
                    <span className="ui-selector__option-description">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
