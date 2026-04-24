"use client";

import { Textarea } from "@/components/ui/textarea";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "defaultPaymentInstructions",
  "enableSplitPayments",
  "enablePartialPayments",
  "requireApprovalForVoids",
  "requireApprovalForDiscounts",
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

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Payment operations"
        description="Till behaviour, instructions, and approval gates for sensitive actions."
      />

      <SettingsSection
        title="Till behaviour"
        description="How payments flow at the point of sale."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Enable split payments"
          description="Allow one order to be paid by multiple methods."
          checked={!!v.enableSplitPayments}
          onChange={(x) => p.setField("enableSplitPayments", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Enable partial payments"
          description="Accept partial settlement and leave the balance owing on the order."
          checked={!!v.enablePartialPayments}
          onChange={(x) => p.setField("enablePartialPayments", x)}
          disabled={p.isPending}
        />
        <Field
          label="Default payment instructions"
          hint="Shown to staff when collecting payment, and on customer-facing payment screens."
        >
          <Textarea
            rows={3}
            value={v.defaultPaymentInstructions ?? ""}
            onChange={(e) => p.setField("defaultPaymentInstructions", e.target.value)}
            disabled={p.isPending}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Approvals"
        description="Manager sign-off required for sensitive actions."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Require approval for voids"
          checked={!!v.requireApprovalForVoids}
          onChange={(x) => p.setField("requireApprovalForVoids", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Require approval for discounts"
          checked={!!v.requireApprovalForDiscounts}
          onChange={(x) => p.setField("requireApprovalForDiscounts", x)}
          disabled={p.isPending}
        />
      </SettingsSection>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
