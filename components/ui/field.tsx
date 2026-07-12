import * as React from "react";

import { cn } from "@/lib/utils";
import { FormLabel } from "@/components/ui/form";

/**
 * Reusable form-control primitives — the shared "input field" look used across
 * the dashboard (see the Settlo Admin design). A 44px control box with an orange
 * focus ring, optional prefix icon and suffix (e.g. a currency code), plus a
 * matching label/hint and select-trigger styling.
 *
 * Built on the app's semantic tokens (primary, line-2, ink, muted-2, …) so the
 * design maps 1:1 onto light/dark mode. Designed to slot into react-hook-form:
 * drop `ControlInput`/`ControlTextarea` inside `<FormControl>`, use `FieldLabel`
 * in place of `FormLabel`, and apply `controlSelectTriggerClass` to a
 * `<SelectTrigger>`.
 */

// ── Label ───────────────────────────────────────────────────────────

export interface FieldLabelProps
  extends React.ComponentPropsWithoutRef<typeof FormLabel> {
  /** Show an orange required asterisk after the label text. */
  required?: boolean;
  /** Show an "Optional" badge pushed to the right. */
  optional?: boolean;
}

export const FieldLabel = React.forwardRef<
  React.ElementRef<typeof FormLabel>,
  FieldLabelProps
>(function FieldLabel({ required, optional, className, children, ...props }, ref) {
  return (
    <FormLabel
      ref={ref}
      className={cn(
        "flex items-center gap-1.5 text-[13px] font-semibold leading-none text-ink",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-primary">*</span>}
      {optional && (
        <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
          Optional
        </span>
      )}
    </FormLabel>
  );
});

// ── Hint ────────────────────────────────────────────────────────────

export function FieldHint({
  className,
  tone = "default",
  children,
}: {
  className?: string;
  /** "pos" renders the mono green style used for margin/savings hints. */
  tone?: "default" | "pos";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-[11.5px] leading-snug text-muted-foreground",
        tone === "pos" &&
          "font-mono text-[10.5px] uppercase tracking-[0.02em] text-emerald-600 dark:text-emerald-500",
        className,
      )}
    >
      {children}
    </p>
  );
}

// ── Control box (shared wrapper) ────────────────────────────────────

/** The 44px control box styling — reuse to wrap any input (e.g. a NumericFormat). */
export const controlBoxClass =
  "flex h-11 items-center gap-[9px] rounded-[10px] border border-line-2 bg-card px-[13px] transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 aria-[invalid=true]:border-destructive has-[[aria-invalid=true]]:border-destructive data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60";

/** Bare inner input styling for use inside a control box (e.g. on a NumericFormat). */
export const controlInputClass =
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-muted-2 disabled:cursor-not-allowed";

/** Divided trailing adornment (e.g. a currency code). */
export const controlSuffixClass =
  "grid shrink-0 self-stretch place-items-center border-l border-line px-[13px] font-mono text-[11px] font-semibold text-muted-foreground";

export interface ControlBoxProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "prefix"> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

/**
 * The control box as a standalone wrapper — put any input inside (styled with
 * `controlInputClass`), e.g. a `<NumericFormat>`. forwardRef so it can be the
 * child of a `<FormControl>` (which forwards id/aria to it).
 */
export const ControlBox = React.forwardRef<HTMLDivElement, ControlBoxProps>(
  function ControlBox({ prefix, suffix, className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(controlBoxClass, suffix ? "pr-0" : "", className)}
        {...props}
      >
        {prefix && (
          <span className="grid shrink-0 place-items-center text-muted-2">
            {prefix}
          </span>
        )}
        {children}
        {suffix && <span className={controlSuffixClass}>{suffix}</span>}
      </div>
    );
  },
);

// ── Text input ──────────────────────────────────────────────────────

export interface ControlInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  /** Leading adornment (usually an icon). */
  prefix?: React.ReactNode;
  /** Trailing adornment, divided off — e.g. a currency code. */
  suffix?: React.ReactNode;
  /** Tabular-mono font for numeric inputs. */
  mono?: boolean;
}

export const ControlInput = React.forwardRef<HTMLInputElement, ControlInputProps>(
  function ControlInput(
    { prefix, suffix, mono, className, disabled, ...props },
    ref,
  ) {
    return (
      <div
        data-disabled={disabled ? "" : undefined}
        className={cn(controlBoxClass, suffix ? "pr-0" : "")}
      >
        {prefix && (
          <span className="grid shrink-0 place-items-center text-muted-2">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            controlInputClass,
            mono && "font-mono tabular-nums",
            className,
          )}
          {...props}
        />
        {suffix && <span className={controlSuffixClass}>{suffix}</span>}
      </div>
    );
  },
);

// ── Textarea ────────────────────────────────────────────────────────

export const ControlTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function ControlTextarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[84px] w-full resize-y rounded-[10px] border border-line-2 bg-card px-[13px] py-3 text-sm leading-relaxed text-ink outline-none transition-[border-color,box-shadow]",
        "placeholder:text-muted-2 focus:border-primary focus:ring-[3px] focus:ring-primary/15",
        "aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});

// ── Select trigger styling ──────────────────────────────────────────

/**
 * Apply to a shadcn `<SelectTrigger className={controlSelectTriggerClass}>` so
 * selects match the control box (height, radius, border, orange focus ring).
 */
export const controlSelectTriggerClass =
  "h-11 rounded-[10px] border-line-2 bg-card px-[13px] text-sm text-ink ring-offset-0 data-[placeholder]:text-muted-2 focus:border-primary focus:ring-[3px] focus:ring-primary/15 focus:ring-offset-0";

// ── Combobox trigger styling ────────────────────────────────────────

/**
 * Apply to a `<Button variant="outline" role="combobox">` popover trigger so
 * searchable pickers (unit / currency / stock-variant / supplier selectors, the
 * multi-select) match the plain `<Select>` control box — same 44px height, 10px
 * radius, hairline border, and orange focus/open ring. `variant="outline"`
 * already supplies `border-line-2 bg-card text-ink`; this only fixes the size,
 * radius, weight, and open-state ring. Merge extra classes after it via `cn`.
 */
export const controlComboboxTriggerClass =
  "h-11 w-full justify-between gap-2 rounded-[10px] px-[13px] text-sm font-normal text-ink hover:border-ink-3 hover:bg-card focus-visible:border-primary data-[state=open]:border-primary data-[state=open]:ring-[3px] data-[state=open]:ring-primary/15";

// ── Segmented radio ─────────────────────────────────────────────────

export function SegmentedRadio({
  value,
  onChange,
  options,
  disabled,
  className,
  stretch,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  /** When true, options share the full container width equally. */
  stretch?: boolean;
}) {
  return (
    <div
      className={cn(
        stretch ? "flex gap-2.5" : "flex flex-wrap gap-2.5",
        className,
      )}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => !disabled && onChange(o.value)}
            disabled={disabled}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-[10px] border px-[15px] py-[11px] text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
              stretch && "flex-1 justify-center",
              on
                ? "border-primary bg-primary/[0.06] text-ink"
                : "border-line-2 bg-card text-ink-2 hover:border-muted-2",
            )}
          >
            <span
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center rounded-full border-[1.6px]",
                on ? "border-primary" : "border-muted-2",
              )}
            >
              {on && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Boolean rendered as a two-option segmented control — reuse this wherever a
 * yes/no setting should look like the schedule Mode / Available controls
 * instead of a bare switch, so on/off toggles stay visually consistent.
 */
export function SegmentedBoolean({
  value,
  onChange,
  trueLabel,
  falseLabel,
  disabled,
  className,
  stretch = true,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel: string;
  falseLabel: string;
  disabled?: boolean;
  className?: string;
  stretch?: boolean;
}) {
  return (
    <SegmentedRadio
      value={value ? "true" : "false"}
      onChange={(v) => onChange(v === "true")}
      options={[
        { value: "true", label: trueLabel },
        { value: "false", label: falseLabel },
      ]}
      disabled={disabled}
      className={className}
      stretch={stretch}
    />
  );
}
