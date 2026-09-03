"use client";

import { Printer, Ruler } from "lucide-react";

import { RadioCards, ToggleRow } from "@/components/ui/field";
import { SettingsSection } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "showAmountOnDockets",
  "printEachDocketItem",
  "showDocketCount",
  "singleDocketPrint",
  "showPriceOnDocket",
  "autoPrintDockets",
  "allowDuplicateDocketPrinting",
  "useModernPrintTemplate",
  "printDensity",
  "orderPrintsCountEnabled",
] as const;

const DENSITY_OPTIONS = [
  {
    value: "STANDARD" as const,
    label: "Standard",
    description: "Full-size layout. The most legible, and the most paper.",
  },
  {
    value: "COMPACT" as const,
    label: "Compact",
    description: "Smaller type and tighter spacing, same content. About 30% shorter.",
  },
  {
    value: "ULTRA" as const,
    label: "Ultra compact",
    description:
      "Smallest legible type. Drops the header logo, the receipt QR caption and the order duration. About 50% shorter.",
  },
];

export function DocketsPanel({
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
        title="Dockets"
        description="What goes on the paper that reaches the kitchen or bar, and how prints are controlled."
      />

      <SettingsSection
        icon={<Printer className="h-4 w-4" />}
        title="Docket content & printing"
        description="What each docket shows and when it prints."
        onSave={p.save}
        onDiscard={() => p.reset()}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Modern print layout"
            hint="Use the designed image layout for dockets and bills. Off = classic text layout."
            checked={!!v.useModernPrintTemplate}
            onChange={(x) => p.setField("useModernPrintTemplate", x)}
            disabled={d}
          />
          <ToggleRow
            label="Auto-print dockets"
            hint="Print the moment an order is sent, without a manual step."
            checked={!!v.autoPrintDockets}
            onChange={(x) => p.setField("autoPrintDockets", x)}
            disabled={d}
          />
          <ToggleRow
            label="Show amount on dockets"
            hint="Print the order total on the docket."
            checked={!!v.showAmountOnDockets}
            onChange={(x) => p.setField("showAmountOnDockets", x)}
            disabled={d}
          />
          <ToggleRow
            label="Show price on kitchen docket"
            hint="Print each item's price on the kitchen docket."
            checked={!!v.showPriceOnDocket}
            onChange={(x) => p.setField("showPriceOnDocket", x)}
            disabled={d}
          />
          <ToggleRow
            label="Print each item on its own docket"
            hint="One docket per item instead of grouping the order."
            checked={!!v.printEachDocketItem}
            onChange={(x) => p.setField("printEachDocketItem", x)}
            disabled={d}
          />
          <ToggleRow
            label="Single-docket print per order"
            hint="Force every docket to the main printer."
            checked={!!v.singleDocketPrint}
            onChange={(x) => p.setField("singleDocketPrint", x)}
            disabled={d}
          />
          <ToggleRow
            label="Show docket count"
            hint="Print the running docket count on each printout."
            checked={!!v.showDocketCount}
            onChange={(x) => p.setField("showDocketCount", x)}
            disabled={d}
          />
          <ToggleRow
            label="Allow duplicate docket prints"
            hint="Permit reprinting a docket that already printed."
            checked={!!v.allowDuplicateDocketPrinting}
            onChange={(x) => p.setField("allowDuplicateDocketPrinting", x)}
            disabled={d}
          />
          <ToggleRow
            label="Count order prints"
            hint="Track how many times each order has been printed."
            checked={!!v.orderPrintsCountEnabled}
            onChange={(x) => p.setField("orderPrintsCountEnabled", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Ruler className="h-4 w-4" />}
        title="Bill & receipt print density"
        description="How tightly the modern layout packs bills and receipts on 80mm rolls. Kitchen dockets always print at full size; 58mm rolls and the classic text layout ignore this."
        onSave={p.save}
        onDiscard={() => p.reset()}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <RadioCards
          // Whitelist rather than `?? "STANDARD"`: a value this build doesn't
          // know (an older/newer Accounts, a hand-edited row) is non-null, so
          // the nullish default would miss it and render no selected card.
          value={
            v.printDensity === "COMPACT" || v.printDensity === "ULTRA"
              ? v.printDensity
              : "STANDARD"
          }
          onChange={(next) => p.setField("printDensity", next)}
          options={DENSITY_OPTIONS}
          disabled={d}
        />
      </SettingsSection>
    </div>
  );
}
