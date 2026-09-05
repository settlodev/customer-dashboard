"use client";

import { ArrowLeftRight, PackageCheck, ShieldCheck } from "lucide-react";

import {
  ControlInput,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { SettingsSection, parseOptionalNumber } from "../../shared/settings-section";
import { useStoreSettingsPanel } from "../../shared/use-settings-panel";
import { PanelHeader } from "../../shared/panel-header";
import { SettingsSaveBar } from "../../shared/settings-save-bar";
import type { StoreSettings } from "@/types/store/type";

const KEYS = [
  "allowInboundTransfers",
  "allowOutboundTransfers",
  "requireTransferApproval",
  "transferApprovalThreshold",
  "autoApproveTransferLimit",
  "allowStockRequestsOverAvailable",
] as const;

const ICON = "h-3.5 w-3.5";

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
  const d = p.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Transfers & requests"
        description="How stock moves in and out of this store, and what others may ask it for."
      />

      <SettingsSection
        icon={<ArrowLeftRight className="h-4 w-4" />}
        title="Transfer directions"
        description="Which way stock is allowed to move for this store."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Inbound transfers"
            hint="Accept stock from the parent location, a warehouse or a sibling store."
            checked={!!v.allowInboundTransfers}
            onChange={(x) => p.setField("allowInboundTransfers", x)}
            disabled={d}
          />
          <ToggleRow
            label="Outbound transfers"
            hint="Let this store dispatch stock to the parent location or a sibling store."
            checked={!!v.allowOutboundTransfers}
            onChange={(x) => p.setField("allowOutboundTransfers", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Approvals"
        description="Whether an incoming transfer has to be accepted here before the source can dispatch it."
        aside={
          <span className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            Thresholds pending
          </span>
        }
      >
        <ToggleRow
          label="Require transfer approval"
          hint="Someone at this store must accept an incoming transfer before stock leaves the source."
          checked={!!v.requireTransferApproval}
          onChange={(x) => p.setField("requireTransferApproval", x)}
          disabled={d}
        />
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Approval threshold"
            hint="Reserved for a future threshold model — not enforced yet."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                suffix="units"
                prefix={<PackageCheck className={ICON} />}
                value={v.transferApprovalThreshold ?? ""}
                onChange={(e) =>
                  p.setField("transferApprovalThreshold", parseOptionalNumber(e.target.value))
                }
                placeholder="—"
                disabled={d}
              />
            )}
          </Field>
          <Field
            label="Auto-approve below"
            hint="Reserved for a future threshold model — not enforced yet."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                suffix="units"
                prefix={<PackageCheck className={ICON} />}
                value={v.autoApproveTransferLimit ?? ""}
                onChange={(e) =>
                  p.setField("autoApproveTransferLimit", parseOptionalNumber(e.target.value))
                }
                placeholder="—"
                disabled={d}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<PackageCheck className="h-4 w-4" />}
        title="Stock requests against this store"
        description="Applies when another destination raises a stock request with this store as the source."
      >
        <ToggleRow
          label="Allow requests over available quantity"
          hint="Let others request more than this store has on hand — useful when restock is inbound. Off caps each line at available stock."
          checked={!!v.allowStockRequestsOverAvailable}
          onChange={(x) => p.setField("allowStockRequestsOverAvailable", x)}
          disabled={d}
        />
      </SettingsSection>

      <SettingsSaveBar
        dirtyCount={p.dirtyCount}
        isPending={p.isPending}
        onSave={p.save}
        onDiscard={() => p.reset()}
      />
    </div>
  );
}
