"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";
import { ORDERING_MODE_OPTIONS } from "@/types/location-settings/type";

const KEYS = [
  "orderingMode",
  "enableTableManagement",
  "enableKitchenDisplay",
  "allowTipping",
  "allowOrderRequests",
  "allowCustomPrice",
  "showPosProductPrice",
  "showPosProductQuantity",
  "useShifts",
  "usePasscodes",
  "ecommerceEnabled",
  "autoOpenCashDrawer",
  "autoCloseOrderWhenFullyPaid",
  "autoCloseOrderMinutes",
  "receiptCopies",
  "orderNamePrefix",
  "includeDateInOrderName",
  "orderNumberStart",
  "orderNumberPadding",
  "showOrderNumberPrefix",
] as const;

export function OrdersPosPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const panel = useSettingsPanel(KEYS, settings, onSaved);
  const v = panel.values;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Order behaviour"
        description="How orders are created and handled on the POS."
        onSave={panel.save}
        isPending={panel.isPending}
        isDirty={panel.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Labelled label="Ordering mode">
            <Select
              value={v.orderingMode ?? "STANDARD"}
              onValueChange={(val) =>
                panel.setField("orderingMode", val as LocationSettings["orderingMode"])
              }
              disabled={panel.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDERING_MODE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labelled>
          <Labelled label="Auto-close idle orders after (mins)">
            <Input
              type="number"
              min={1}
              value={v.autoCloseOrderMinutes ?? ""}
              onChange={(e) =>
                panel.setField(
                  "autoCloseOrderMinutes",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </Labelled>
        </div>

        <div className="space-y-1">
          <SettingsSwitchRow
            label="Table management"
            description="Require a table to be selected before placing an order."
            checked={!!v.enableTableManagement}
            onChange={(x) => panel.setField("enableTableManagement", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Kitchen display system"
            description="Route tickets to connected KDS screens."
            checked={!!v.enableKitchenDisplay}
            onChange={(x) => panel.setField("enableKitchenDisplay", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Allow tipping"
            checked={!!v.allowTipping}
            onChange={(x) => panel.setField("allowTipping", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Allow order requests"
            description="Accept orders from digital menus or external sources."
            checked={!!v.allowOrderRequests}
            onChange={(x) => panel.setField("allowOrderRequests", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Allow custom pricing"
            description="Staff can override the selling price on a line."
            checked={!!v.allowCustomPrice}
            onChange={(x) => panel.setField("allowCustomPrice", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Enable shifts"
            checked={!!v.useShifts}
            onChange={(x) => panel.setField("useShifts", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Require passcodes for staff actions"
            checked={!!v.usePasscodes}
            onChange={(x) => panel.setField("usePasscodes", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Ecommerce storefront"
            checked={!!v.ecommerceEnabled}
            onChange={(x) => panel.setField("ecommerceEnabled", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Auto-open cash drawer"
            checked={!!v.autoOpenCashDrawer}
            onChange={(x) => panel.setField("autoOpenCashDrawer", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Auto-close when fully paid"
            checked={!!v.autoCloseOrderWhenFullyPaid}
            onChange={(x) => panel.setField("autoCloseOrderWhenFullyPaid", x)}
            disabled={panel.isPending}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="POS display"
        description="What cashiers see while taking orders."
        onSave={panel.save}
        isPending={panel.isPending}
        isDirty={panel.isDirty}
      >
        <div className="space-y-1">
          <SettingsSwitchRow
            label="Show price on POS"
            checked={!!v.showPosProductPrice}
            onChange={(x) => panel.setField("showPosProductPrice", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Show stock quantity on POS"
            checked={!!v.showPosProductQuantity}
            onChange={(x) => panel.setField("showPosProductQuantity", x)}
            disabled={panel.isPending}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Order numbering"
        description="How generated order names and numbers look on tickets and receipts."
        onSave={panel.save}
        isPending={panel.isPending}
        isDirty={panel.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Labelled label="Order name prefix">
            <Input
              maxLength={50}
              value={v.orderNamePrefix ?? ""}
              onChange={(e) => panel.setField("orderNamePrefix", e.target.value)}
              disabled={panel.isPending}
            />
          </Labelled>
          <Labelled label="Order number start">
            <Input
              type="number"
              min={1}
              value={v.orderNumberStart ?? ""}
              onChange={(e) =>
                panel.setField(
                  "orderNumberStart",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </Labelled>
          <Labelled label="Order number padding">
            <Input
              type="number"
              min={1}
              max={10}
              value={v.orderNumberPadding ?? ""}
              onChange={(e) =>
                panel.setField(
                  "orderNumberPadding",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </Labelled>
          <Labelled label="Receipt copies">
            <Input
              type="number"
              min={1}
              max={10}
              value={v.receiptCopies ?? ""}
              onChange={(e) =>
                panel.setField(
                  "receiptCopies",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={panel.isPending}
            />
          </Labelled>
        </div>
        <div className="space-y-1">
          <SettingsSwitchRow
            label="Include date in order name"
            checked={!!v.includeDateInOrderName}
            onChange={(x) => panel.setField("includeDateInOrderName", x)}
            disabled={panel.isPending}
          />
          <SettingsSwitchRow
            label="Show order name prefix on receipts"
            checked={!!v.showOrderNumberPrefix}
            onChange={(x) => panel.setField("showOrderNumberPrefix", x)}
            disabled={panel.isPending}
          />
        </div>
      </SettingsSection>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
