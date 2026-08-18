import React from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/helpers";

interface MoneyProps {
  amount: number | null | undefined;
  currency?: string | null;
  placeholder?: React.ReactNode;
  className?: string;
  currencyClassName?: string;
}

export function Money({
  amount,
  currency,
  placeholder = "—",
  className,
  currencyClassName,
}: MoneyProps) {
  if (amount == null || Number.isNaN(amount)) {
    return <span className={className}>{placeholder}</span>;
  }
  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  return (
    <span className={className}>
      {amount.toLocaleString()}
      <span
        style={{ fontSize: "0.7em" }}
        className={cn(
          "ml-1 font-medium text-muted-foreground",
          currencyClassName,
        )}
      >
        {code}
      </span>
    </span>
  );
}

export default Money;
