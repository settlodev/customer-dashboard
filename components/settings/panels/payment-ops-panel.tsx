"use client";

import { ShieldCheck, Wallet } from "lucide-react";

import {
  ControlTextarea,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "defaultPaymentInstructions",
  "enableSplitPayments",
  "enablePartialPayments",
  "requireApprovalForVoids",
  "requireApprovalForDiscounts",
  "requireApprovalForDayClose",
] as const;

export function PaymentOpsPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;
  const d = p.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Payment operations"
        description="Till behaviour, instructions, and approval gates for sensitive actions."
      />

      <SettingsSection
        icon={<Wallet className="h-4 w-4" />}
        title="Till behaviour"
        description="How payments flow at the point of sale."
        onSave={p.save}
        onDiscard={() => p.reset()}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Split payments"
            hint="Allow one order to be paid by multiple methods."
            checked={!!v.enableSplitPayments}
            onChange={(x) => p.setField("enableSplitPayments", x)}
            disabled={d}
          />
          <ToggleRow
            label="Partial payments"
            hint="Accept part-settlement and leave the balance owing on the order."
            checked={!!v.enablePartialPayments}
            onChange={(x) => p.setField("enablePartialPayments", x)}
            disabled={d}
          />
        </div>
        <Field
          label="Default payment instructions"
          hint="Shown to staff when collecting payment, and on customer-facing payment screens."
          optional
        >
          {(id) => (
            <ControlTextarea
              id={id}
              rows={3}
              placeholder="e.g. Pay by M-Pesa to 123456, reference your order number."
              value={v.defaultPaymentInstructions ?? ""}
              onChange={(e) => p.setField("defaultPaymentInstructions", e.target.value)}
              disabled={d}
            />
          )}
        </Field>
      </SettingsSection>

      <SettingsSection
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Approvals"
        description="Manager sign-off required for sensitive actions."
        onSave={p.save}
        onDiscard={() => p.reset()}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Approve voids"
            hint="A manager must authorise voiding a line or an order."
            checked={!!v.requireApprovalForVoids}
            onChange={(x) => p.setField("requireApprovalForVoids", x)}
            disabled={d}
          />
          <ToggleRow
            label="Approve discounts"
            hint="A manager must authorise discounts above the threshold set on Location."
            checked={!!v.requireApprovalForDiscounts}
            onChange={(x) => p.setField("requireApprovalForDiscounts", x)}
            disabled={d}
          />
          <ToggleRow
            label="Approve day close"
            hint="A second manager must authorise the end-of-day cash-up close."
            checked={!!v.requireApprovalForDayClose}
            onChange={(x) => p.setField("requireApprovalForDayClose", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
