"use client";

import { useId, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormError } from "@/components/widgets/form-error";
import { FINANCING_TERMS_CLAUSES } from "./terms-copy";

/**
 * Step 1 of the finance-flow modal: scrollable terms copy + explicit
 * agreement checkbox. Purely presentational — the modal shell owns the
 * acceptFinancingTerms → startLpoFinancing sequence and reports progress
 * through `submitting` / `error`. Shown only when the account has NOT yet
 * accepted the current terms version (account-level fact; re-opening the
 * modal later skips this step).
 */
export function TermsStep({
  termsVersion,
  submitting,
  error,
  onAgree,
}: {
  termsVersion: string;
  submitting: boolean;
  error: string | null;
  onAgree: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const checkboxId = useId();

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-primary-light text-primary-dark">
          <ScrollText className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink">
            Supplier financing terms
          </div>
          <div className="text-xs text-muted-foreground">
            One-time acceptance for your account — version {termsVersion}
          </div>
        </div>
      </div>

      <ScrollArea className="h-64 rounded-lg border border-line bg-canvas/60">
        <ol className="space-y-3.5 p-4">
          {FINANCING_TERMS_CLAUSES.map((clause, i) => (
            <li key={clause.title} className="flex gap-2.5">
              <span className="font-mono text-[11px] font-semibold text-ink-3">
                {i + 1}.
              </span>
              <div>
                <div className="text-[12.5px] font-semibold text-ink">
                  {clause.title}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-2">
                  {clause.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </ScrollArea>

      <label
        htmlFor={checkboxId}
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-2 p-3.5 text-left has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-light"
      >
        <Checkbox
          id={checkboxId}
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          disabled={submitting}
          className="mt-0.5"
        />
        <span className="text-[13px] leading-relaxed text-ink-2">
          I have read and accept the{" "}
          <b className="font-semibold text-ink">Settlo financing terms</b> and{" "}
          <b className="font-semibold text-ink">privacy notice</b>.
        </span>
      </label>

      {error && <FormError message={error} />}

      <Button
        className="w-full justify-center"
        disabled={!agreed || submitting}
        onClick={onAgree}
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up financing…
          </span>
        ) : (
          "Agree & continue"
        )}
      </Button>
    </div>
  );
}
