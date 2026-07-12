"use client";

import React, { useEffect, useState } from "react";

import { Combobox } from "@/components/ui/combobox";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { listPaymentMethodMappings } from "@/lib/actions/accounting-mapping-actions";

interface Props {
  value?: string;
  placeholder?: string;
  isDisabled?: boolean;
  /** `code` is the method's canonical code (e.g. CASH/MPESA) — callers that
   *  only need id+label can ignore it. */
  onChange: (value: string, label: string, code: string) => void;
}

interface FlatOption {
  id: string;
  label: string;
  code: string;
}

/**
 * Flat selector listing only the payment methods that are actively mapped
 * to a chart-of-account at this location — sourced from the Accounting
 * Service's GL mappings, not the raw Payments-Service method list. Used by
 * the expense-payment and invoice-payment forms so operators can only pick
 * a method whose payment will actually post cleanly; an unmapped method
 * would otherwise land in a suspense account (degraded posting).
 *
 * The emitted `id` is `mapping.paymentMethodId` — the Payments-Service
 * method id — and NOT the mapping row's own primary key, because both
 * consuming backends resolve the mapping again by
 * `(locationId, paymentMethodId)`.
 */
export function ExpensePaymentMethodSelector({
  value,
  placeholder,
  isDisabled,
  onChange,
}: Props) {
  const [options, setOptions] = useState<FlatOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const location = await getCurrentLocation();
        if (!location?.id) {
          if (!cancelled) setOptions([]);
          return;
        }
        const result = await listPaymentMethodMappings(location.id, true);
        if (cancelled) return;
        const flat: FlatOption[] = (result.data ?? []).map((m) => ({
          id: m.paymentMethodId,
          label: `${m.paymentMethodCode} · ${m.chartOfAccountName ?? "Unmapped account"}`,
          code: m.paymentMethodCode,
        }));
        setOptions(flat);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Combobox
      options={options.map((o) => ({
        value: o.id,
        label: o.label,
        keywords: [o.code],
      }))}
      value={value ?? null}
      onChange={(v) => {
        const opt = options.find((o) => o.id === v);
        onChange(v ?? "", opt?.label ?? "", opt?.code ?? "");
      }}
      placeholder={placeholder ?? "Select payment method"}
      searchPlaceholder="Search payment methods…"
      emptyText={
        loading
          ? "Loading payment methods…"
          : "No payment methods mapped for this location"
      }
      disabled={isDisabled || loading}
      ariaLabel="Payment method"
    />
  );
}
