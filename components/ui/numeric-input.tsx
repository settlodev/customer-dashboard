import * as React from "react";
import { NumericFormat } from "react-number-format";

import { cn } from "@/lib/utils";

export interface NumericInputProps {
  value?: number | null;
  onChange?: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  thousandSeparator?: boolean | string;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  allowNegative?: boolean;
  prefix?: string;
  suffix?: string;
  name?: string;
  id?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      className,
      value,
      onChange,
      thousandSeparator = true,
      placeholder = "0.00",
      ...props
    },
    ref,
  ) => {
    return (
      <NumericFormat
        getInputRef={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-line-2 bg-card px-3 py-2 text-[13px] text-ink shadow-sm",
          "transition-[border-color,box-shadow] duration-150",
          "placeholder:text-muted-2",
          "hover:border-ink-3",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
          className,
        )}
        value={value ?? ""}
        onValueChange={(values) => {
          onChange?.(values.value === "" ? undefined : Number(values.value));
        }}
        thousandSeparator={thousandSeparator}
        placeholder={placeholder}
        {...props}
      />
    );
  },
);
NumericInput.displayName = "NumericInput";

export { NumericInput };
