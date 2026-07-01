"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NumericFormat } from "react-number-format";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  Loader2,
  Scale,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  restructureLoan,
  waiveLoan,
  writeOffLoan,
} from "@/lib/actions/admin/loans";
import {
  ALLOCATION_PRIORITY_OPTIONS,
  type AllocationPriority,
  type LoanResponse,
} from "@/types/admin/loans";
import type { FormResponse } from "@/types/types";

type Mode = "restructure" | "waiver" | "writeoff" | null;

export function LoanLifecyclePanel({ loan }: { loan: LoanResponse }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>(null);

  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [component, setComponent] = useState<AllocationPriority>("PENALTY");
  const [amount, setAmount] = useState<number | "">("");
  const [newTermDays, setNewTermDays] = useState<number | "">(loan.termDays);
  const [newInstallmentCount, setNewInstallmentCount] = useState<number | "">(
    loan.installmentCount,
  );

  const pick = (m: Mode) => {
    setError("");
    setReference("");
    setReason("");
    setComponent("PENALTY");
    setAmount("");
    setNewTermDays(loan.termDays);
    setNewInstallmentCount(loan.installmentCount);
    setMode(m);
  };

  const handle = (res: FormResponse<unknown>, title: string) => {
    if (res.responseType === "error") {
      setError(res.message);
      return;
    }
    toast({ title, description: res.message });
    setMode(null);
    router.refresh();
  };

  const runWriteOff = () =>
    startTransition(async () => {
      setError("");
      handle(
        await writeOffLoan(loan.id, { reference, reason }),
        "Loan written off",
      );
    });
  const runWaiver = () =>
    startTransition(async () => {
      setError("");
      handle(
        await waiveLoan(loan.id, {
          component,
          amount: amount === "" ? 0 : amount,
          reference,
          reason,
        }),
        "Amount waived",
      );
    });
  const runRestructure = () =>
    startTransition(async () => {
      setError("");
      handle(
        await restructureLoan(loan.id, {
          newTermDays: newTermDays === "" ? 0 : newTermDays,
          newInstallmentCount:
            newInstallmentCount === "" ? 0 : newInstallmentCount,
          reference,
          reason,
        }),
        "Loan restructured",
      );
    });

  const refValid = reference.trim().length > 0;

  return (
    <section className="rounded-xl border border-line bg-card">
      <header className="border-b border-line px-5 py-3.5">
        <h3 className="text-sm font-semibold text-ink">Manage loan</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Restructure the schedule, waive a component, or write the loan off.
        </p>
      </header>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-2">
          <ModeButton
            active={mode === "restructure"}
            onClick={() => pick("restructure")}
            disabled={isPending}
            icon={<CalendarClock className="h-4 w-4" />}
            label="Restructure"
          />
          <ModeButton
            active={mode === "waiver"}
            onClick={() => pick("waiver")}
            disabled={isPending}
            icon={<Scale className="h-4 w-4" />}
            label="Waiver"
          />
          <ModeButton
            active={mode === "writeoff"}
            onClick={() => pick("writeoff")}
            disabled={isPending}
            icon={<Ban className="h-4 w-4" />}
            label="Write off"
            danger
          />
        </div>

        {mode ? (
          <div className="mt-5 space-y-4">
            {mode === "restructure" ? (
              <div className="grid grid-cols-2 gap-4">
                <Numeric
                  label="New term (days)"
                  value={newTermDays}
                  onChange={setNewTermDays}
                  disabled={isPending}
                />
                <Numeric
                  label="New installments"
                  value={newInstallmentCount}
                  onChange={setNewInstallmentCount}
                  disabled={isPending}
                />
              </div>
            ) : null}

            {mode === "waiver" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Component</Label>
                  <Select
                    value={component}
                    onValueChange={(v) => setComponent(v as AllocationPriority)}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALLOCATION_PRIORITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Numeric
                  label="Amount"
                  value={amount}
                  onChange={setAmount}
                  disabled={isPending}
                  prefix={loan.currency}
                  thousands
                  decimalScale={2}
                />
              </div>
            ) : null}

            {mode === "writeoff" ? (
              <div className="flex items-start gap-2 rounded-lg border border-neg/30 bg-neg/5 px-3 py-2 text-xs text-neg">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                Writing off closes the loan as {""}
                <span className="font-mono">WRITTEN_OFF</span> and clears its
                outstanding balance. This can&apos;t be undone.
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="lifecycle-ref" className="text-xs">
                Reference <span className="text-primary">*</span>
              </Label>
              <Input
                id="lifecycle-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Approval / ticket reference"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lifecycle-reason" className="text-xs">
                Reason (optional)
              </Label>
              <Textarea
                id="lifecycle-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={2000}
                disabled={isPending}
              />
            </div>

            {error ? <FormError message={error} /> : null}

            <div className="flex items-center gap-2">
              {mode === "restructure" ? (
                <Button
                  type="button"
                  onClick={runRestructure}
                  disabled={
                    isPending ||
                    !refValid ||
                    newTermDays === "" ||
                    Number(newTermDays) <= 0 ||
                    newInstallmentCount === "" ||
                    Number(newInstallmentCount) <= 0
                  }
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Restructure loan
                </Button>
              ) : null}
              {mode === "waiver" ? (
                <Button
                  type="button"
                  onClick={runWaiver}
                  disabled={
                    isPending ||
                    !refValid ||
                    amount === "" ||
                    Number(amount) <= 0
                  }
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Apply waiver
                </Button>
              ) : null}
              {mode === "writeoff" ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={runWriteOff}
                  disabled={isPending || !refValid}
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Write off loan
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ModeButton({
  active,
  danger,
  onClick,
  disabled,
  icon,
  label,
}: {
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors",
        active
          ? danger
            ? "border-neg bg-neg/10 text-neg"
            : "border-primary bg-primary/10 text-primary"
          : cn(
              "border-line bg-card text-ink-2",
              danger ? "hover:border-neg/50 hover:text-neg" : "hover:border-primary/50 hover:text-primary",
            ),
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Numeric({
  label,
  value,
  onChange,
  disabled,
  prefix,
  thousands,
  decimalScale = 0,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  disabled?: boolean;
  prefix?: string;
  thousands?: boolean;
  decimalScale?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-line-2 focus-within:border-primary">
        {prefix ? (
          <span className="grid place-items-center border-r border-line bg-surface px-2.5 font-mono text-[11px] text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <NumericFormat
          customInput={Input}
          thousandSeparator={thousands ? "," : undefined}
          allowNegative={false}
          decimalScale={decimalScale}
          className="border-0 focus-visible:ring-0"
          value={value}
          onValueChange={(v) =>
            onChange(v.value === "" ? "" : (v.floatValue ?? ""))
          }
          disabled={disabled}
        />
      </div>
    </div>
  );
}
