"use client";

import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  onSave?: () => void;
  isPending?: boolean;
  isDirty?: boolean;
  footer?: ReactNode;
}

/**
 * Consistent wrapper for each settings panel: header, body, save bar. Each
 * panel renders one of these and fills children with form fields. The save
 * button is disabled until the form is dirty — keeps accidental saves to
 * a minimum on a page with 200+ fields.
 *
 * When `title` is omitted, the header slot is suppressed — useful when the
 * caller renders its own heading outside the card (e.g. Business Details,
 * Location Details).
 */
export function SettingsSection({
  title,
  description,
  children,
  onSave,
  isPending = false,
  isDirty = false,
  footer,
}: SettingsSectionProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-5 pb-4 space-y-4">
        {(title || description) && (
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <div className="space-y-3">{children}</div>

        {(footer || onSave) && (
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <div>{footer}</div>
            {onSave && (
              <Button
                type="button"
                size="sm"
                onClick={onSave}
                disabled={isPending || !isDirty}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Small labelled wrapper for an input inside a SettingsSection. */
export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Labelled switch row with description — pairs with SettingsSection. */
export function SettingsSwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

/**
 * Mutually exclusive option rows — same rhythm as SettingsSwitchRow, but only
 * one can be on at a time. Use where the underlying settings are separate
 * booleans that must not overlap (e.g. stock deduction timing).
 */
export function SettingsRadioRows<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T | "";
  onChange: (next: T) => void;
  options: readonly { value: T; label: string; description?: string }[];
  disabled?: boolean;
}) {
  const uid = React.useId();

  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as T)}
      disabled={disabled}
      className="gap-0"
    >
      {options.map((opt) => {
        const id = `${uid}-${opt.value}`;
        return (
          <div
            key={opt.value}
            className="flex items-start justify-between gap-4 py-1.5 border-b last:border-b-0"
          >
            <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
              <span className="block text-sm font-medium leading-tight">
                {opt.label}
              </span>
              {opt.description && (
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {opt.description}
                </span>
              )}
            </label>
            <RadioGroupItem id={id} value={opt.value} className="mt-0.5 shrink-0" />
          </div>
        );
      })}
    </RadioGroup>
  );
}
