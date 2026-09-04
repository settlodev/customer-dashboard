"use client";

import {
  Fingerprint,
  Hash,
  KeyRound,
  LayoutGrid,
  Monitor,
  ShoppingBag,
  Tag,
  Timer,
  UtensilsCrossed,
} from "lucide-react";

import {
  ControlInput,
  RadioCards,
  StandaloneField as Field,
  ToggleRow,
  standaloneLabelClass,
} from "@/components/ui/field";
import { SettingsSection, parseOptionalNumber } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "orderingMode",
  "loginMode",
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

const ICON = "h-3.5 w-3.5";

const ORDERING_MODE_CARDS = [
  {
    value: "STANDARD" as const,
    label: "Standard orders",
    description: "Counter-style: each order stands on its own, no table map.",
    icon: <LayoutGrid className={ICON} />,
  },
  {
    value: "TABLE_MANAGEMENT" as const,
    label: "Orders around tables",
    description: "Orders open against a table and can be moved, merged or split.",
    icon: <UtensilsCrossed className={ICON} />,
  },
];

const LOGIN_MODE_CARDS = [
  {
    value: "PIN_AND_FINGERPRINT" as const,
    label: "PIN or fingerprint",
    description: "Staff sign in with whichever is quicker.",
    icon: <KeyRound className={ICON} />,
  },
  {
    value: "FINGERPRINT_ONLY" as const,
    label: "Fingerprint only",
    description: "Needs a paired reader on every device.",
    icon: <Fingerprint className={ICON} />,
  },
  {
    value: "PIN_ONLY" as const,
    label: "PIN only",
    description: "Numeric passcode, no hardware needed.",
    icon: <Hash className={ICON} />,
  },
];

export function OrdersPosPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const panel = useSettingsPanel(KEYS, settings, onSaved);
  const v = panel.values;
  const d = panel.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Orders & POS"
        description="Order flow, POS display, and order-numbering rules."
      />

      <SettingsSection
        icon={<ShoppingBag className="h-4 w-4" />}
        title="Order behaviour"
        description="How orders are created and handled on the POS."
      >
        <div className="space-y-[7px]">
          <span className={standaloneLabelClass}>Ordering mode</span>
          <RadioCards
            value={v.orderingMode ?? "STANDARD"}
            onChange={(val) => panel.setField("orderingMode", val)}
            options={ORDERING_MODE_CARDS}
            disabled={d}
            className="lg:grid-cols-2"
          />
        </div>

        <div className="space-y-[7px]">
          <span className={standaloneLabelClass}>Staff login</span>
          <RadioCards
            value={v.loginMode ?? "PIN_AND_FINGERPRINT"}
            onChange={(val) => panel.setField("loginMode", val)}
            options={LOGIN_MODE_CARDS}
            disabled={d}
          />
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Auto-close idle orders after"
            hint="Open orders with no activity are closed automatically. Leave blank to never auto-close."
          >
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                suffix="min"
                prefix={<Timer className={ICON} />}
                value={v.autoCloseOrderMinutes ?? ""}
                onChange={(e) =>
                  panel.setField("autoCloseOrderMinutes", parseOptionalNumber(e.target.value))
                }
                placeholder="—"
                disabled={d}
              />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Kitchen display system"
            hint="Route tickets to connected KDS screens."
            checked={!!v.enableKitchenDisplay}
            onChange={(x) => panel.setField("enableKitchenDisplay", x)}
            disabled={d}
          />
          <ToggleRow
            label="Allow tipping"
            hint="Offer a tip step when settling an order."
            checked={!!v.allowTipping}
            onChange={(x) => panel.setField("allowTipping", x)}
            disabled={d}
          />
          <ToggleRow
            label="Allow order requests"
            hint="Accept orders from digital menus or external sources."
            checked={!!v.allowOrderRequests}
            onChange={(x) => panel.setField("allowOrderRequests", x)}
            disabled={d}
          />
          <ToggleRow
            label="Allow custom pricing"
            hint="Staff can override the selling price on a line."
            checked={!!v.allowCustomPrice}
            onChange={(x) => panel.setField("allowCustomPrice", x)}
            disabled={d}
          />
          <ToggleRow
            label="Enable shifts"
            hint="Staff clock in and out; sales attribute to a shift."
            checked={!!v.useShifts}
            onChange={(x) => panel.setField("useShifts", x)}
            disabled={d}
          />
          <ToggleRow
            label="Require passcodes for staff actions"
            hint="Ask for a passcode before sensitive POS actions."
            checked={!!v.usePasscodes}
            onChange={(x) => panel.setField("usePasscodes", x)}
            disabled={d}
          />
          <ToggleRow
            label="Ecommerce storefront"
            hint="Expose this location's catalogue to the web storefront."
            checked={!!v.ecommerceEnabled}
            onChange={(x) => panel.setField("ecommerceEnabled", x)}
            disabled={d}
          />
          <ToggleRow
            label="Auto-open cash drawer"
            hint="Pop the drawer when a cash payment is taken."
            checked={!!v.autoOpenCashDrawer}
            onChange={(x) => panel.setField("autoOpenCashDrawer", x)}
            disabled={d}
          />
          <ToggleRow
            label="Auto-close when fully paid"
            hint="Close the order the moment the balance hits zero."
            checked={!!v.autoCloseOrderWhenFullyPaid}
            onChange={(x) => panel.setField("autoCloseOrderWhenFullyPaid", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Monitor className="h-4 w-4" />}
        title="POS display"
        description="What cashiers see while taking orders."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Show price on POS"
            hint="Print the selling price on each product tile."
            checked={!!v.showPosProductPrice}
            onChange={(x) => panel.setField("showPosProductPrice", x)}
            disabled={d}
          />
          <ToggleRow
            label="Show stock quantity on POS"
            hint="Show the on-hand quantity on each product tile."
            checked={!!v.showPosProductQuantity}
            onChange={(x) => panel.setField("showPosProductQuantity", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Hash className="h-4 w-4" />}
        title="Order numbering"
        description="How generated order names and numbers look on tickets and receipts."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Order name prefix" hint="Short code before the number, e.g. ORD.">
            {(id) => (
              <ControlInput
                id={id}
                maxLength={50}
                mono
                prefix={<Tag className={ICON} />}
                value={v.orderNamePrefix ?? ""}
                onChange={(e) => panel.setField("orderNamePrefix", e.target.value)}
                placeholder="ORD"
                disabled={d}
              />
            )}
          </Field>
          <Field label="Order number start" hint="First number issued for this location.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                prefix={<Hash className={ICON} />}
                value={v.orderNumberStart ?? ""}
                onChange={(e) =>
                  panel.setField("orderNumberStart", parseOptionalNumber(e.target.value))
                }
                placeholder="1"
                disabled={d}
              />
            )}
          </Field>
          <Field label="Number padding" hint="Zero-pad to this many digits.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                max={10}
                suffix="digits"
                value={v.orderNumberPadding ?? ""}
                onChange={(e) =>
                  panel.setField("orderNumberPadding", parseOptionalNumber(e.target.value))
                }
                placeholder="4"
                disabled={d}
              />
            )}
          </Field>
          <Field label="Receipt copies" hint="Printed per settled order.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                max={10}
                suffix="copies"
                value={v.receiptCopies ?? ""}
                onChange={(e) =>
                  panel.setField("receiptCopies", parseOptionalNumber(e.target.value))
                }
                placeholder="1"
                disabled={d}
              />
            )}
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Include date in order name"
            hint="Adds the order date to the generated name."
            checked={!!v.includeDateInOrderName}
            onChange={(x) => panel.setField("includeDateInOrderName", x)}
            disabled={d}
          />
          <ToggleRow
            label="Show order name prefix on receipts"
            hint="Print the prefix with the number on customer receipts."
            checked={!!v.showOrderNumberPrefix}
            onChange={(x) => panel.setField("showOrderNumberPrefix", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSaveBar
        dirtyCount={panel.dirtyCount}
        isPending={panel.isPending}
        onSave={panel.save}
        onDiscard={() => panel.reset()}
      />
    </div>
  );
}
