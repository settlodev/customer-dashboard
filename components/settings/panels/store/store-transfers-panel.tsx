"use client";

import { Input } from "@/components/ui/input";
import {
  SettingsSection,
  SettingsSwitchRow,
  SettingsField,
} from "../../shared/settings-section";
import { useStoreSettingsPanel } from "../../shared/use-settings-panel";
import { PanelHeader } from "../../shared/panel-header";
import type { StoreSettings } from "@/types/store/type";

const KEYS = [
  "allowInboundTransfers",
  "allowOutboundTransfers",
  "requireTransferApproval",
  "transferApprovalThreshold",
  "autoApproveTransferLimit",
  "allowStockRequestsOverAvailable",
] as const;

export function StoreTransfersPanel({
  settings,
  storeId,
  onSaved,
}: {
  settings: StoreSettings;
  storeId: string;
  onSaved: (next: StoreSettings) => void;
}) {
  const p = useStoreSettingsPanel(KEYS, settings, storeId, onSaved);
  const v = p.values;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Transfers & requests"
        description="How stock moves in and out of this store, and what others may ask it for."
      />

      <SettingsSection
        title="Transfer directions"
        description="Which way stock is allowed to move for this store."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Allow inbound transfers"
          description="Accept stock transferred into this store from its parent location, a warehouse or a sibling store."
          checked={!!v.allowInboundTransfers}
          onChange={(x) => p.setField("allowInboundTransfers", x)}
          disabled={p.isPending}
        />
        <SettingsSwitchRow
          label="Allow outbound transfers"
          description="Let this store dispatch stock to its parent location or a sibling store."
          checked={!!v.allowOutboundTransfers}
          onChange={(x) => p.setField("allowOutboundTransfers", x)}
          disabled={p.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Approvals"
        description="Whether an incoming transfer has to be accepted here before the source can dispatch it."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Require transfer approval"
          description="Someone at this store must accept an incoming transfer before stock leaves the source."
          checked={!!v.requireTransferApproval}
          onChange={(x) => p.setField("requireTransferApproval", x)}
          disabled={p.isPending}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsField
            label="Approval threshold (qty)"
            hint="Reserved for a future threshold model — not enforced yet."
          >
            <Input
              type="number"
              min={1}
              value={v.transferApprovalThreshold ?? ""}
              onChange={(e) =>
                p.setField(
                  "transferApprovalThreshold",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </SettingsField>
          <SettingsField
            label="Auto-approve below (qty)"
            hint="Reserved for a future threshold model — not enforced yet."
          >
            <Input
              type="number"
              min={1}
              value={v.autoApproveTransferLimit ?? ""}
              onChange={(e) =>
                p.setField(
                  "autoApproveTransferLimit",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Stock requests against this store"
        description="Applies when another destination raises a stock request with this store as the source."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Allow stock requests over available quantity"
          description="Let others request more than this store currently has on hand — useful when restock is already inbound. Off means each requested line is capped at available stock when the request is raised."
          checked={!!v.allowStockRequestsOverAvailable}
          onChange={(x) => p.setField("allowStockRequestsOverAvailable", x)}
          disabled={p.isPending}
        />
      </SettingsSection>
    </div>
  );
}
