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
          // Mirrors `controlBoxClass` in components/ui/field.tsx (as a bare
          // input) so NumericInput reads identically to ControlInput/ControlBox.
          "h-11 w-full rounded-[10px] border border-line-2 bg-card px-[13px] text-sm text-ink tabular-nums",
          "transition-[border-color,box-shadow]",
          "placeholder:text-muted-2",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15",
          "aria-[invalid=true]:border-destructive",
          "disabled:cursor-not-allowed disabled:opacity-60",
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
