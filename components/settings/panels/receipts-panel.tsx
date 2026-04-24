"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  "receiptHeaderImageUrl",
  "receiptNumberPrefix",
  "receiptNumberSuffix",
  "receiptFooterText",
  "physicalReceiptPaymentDetails",
  "digitalReceiptPaymentDetails",
  "includePaymentDetailsOnReceipt",
  "showItemizedReceipt",
  "showTaxOnReceipt",
  "showDiscountOnReceipt",
  "showStaffOnReceipt",
  "showCustomerOnReceipt",
  "showQrCodeOnReceipt",
  "showImageOnReceipt",
  "showAdditionalDetailsOnPhysicalReceipt",
  "showAdditionalDetailsOnDigitalReceipt",
  "autoPrintReceipt",
  "autoEmailReceipt",
  "autoSmsReceipt",
  "invoiceNumberPrefix",
  "includeDateInInvoiceNumber",
  "defaultPaymentTerms",
  "defaultInvoiceDueDays",
  "pricesIncludeTax",
  "defaultTaxRate",
  "taxLabel",
] as const;

export function ReceiptsInvoicingPanel({
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
        title="Receipts & invoicing"
        description="Receipt layout, delivery, payment-details block, invoice numbering, and default tax."
      />

      <SettingsSection
        title="Receipt header & footer"
        description="Header logo and the closing message. Business name and primary header now come from your business profile."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Header logo URL">
            <Input
              maxLength={500}
              value={v.receiptHeaderImageUrl ?? ""}
              onChange={(e) => p.setField("receiptHeaderImageUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Receipt number prefix">
            <Input
              maxLength={50}
              value={v.receiptNumberPrefix ?? ""}
              onChange={(e) => p.setField("receiptNumberPrefix", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Receipt number suffix">
            <Input
              maxLength={50}
              value={v.receiptNumberSuffix ?? ""}
              onChange={(e) => p.setField("receiptNumberSuffix", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
        </div>
        <Field label="Footer text">
          <Textarea
            rows={2}
            value={v.receiptFooterText ?? ""}
            onChange={(e) => p.setField("receiptFooterText", e.target.value)}
            disabled={p.isPending}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Receipt content"
        description="What prints (or emails) on each receipt line. The QR code is generated per receipt automatically."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow label="Itemised line items" checked={!!v.showItemizedReceipt} onChange={(x) => p.setField("showItemizedReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Show tax breakdown" checked={!!v.showTaxOnReceipt} onChange={(x) => p.setField("showTaxOnReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Show discount lines" checked={!!v.showDiscountOnReceipt} onChange={(x) => p.setField("showDiscountOnReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Show cashier / staff name" checked={!!v.showStaffOnReceipt} onChange={(x) => p.setField("showStaffOnReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Show customer name" checked={!!v.showCustomerOnReceipt} onChange={(x) => p.setField("showCustomerOnReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Show item images" checked={!!v.showImageOnReceipt} onChange={(x) => p.setField("showImageOnReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Show QR code" checked={!!v.showQrCodeOnReceipt} onChange={(x) => p.setField("showQrCodeOnReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Extra details on physical receipts" checked={!!v.showAdditionalDetailsOnPhysicalReceipt} onChange={(x) => p.setField("showAdditionalDetailsOnPhysicalReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Extra details on digital receipts" checked={!!v.showAdditionalDetailsOnDigitalReceipt} onChange={(x) => p.setField("showAdditionalDetailsOnDigitalReceipt", x)} disabled={p.isPending} />
      </SettingsSection>

      <SettingsSection
        title="Payment details on receipts"
        description="Bank / MNO details the customer can pay into, shown on the receipt."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Include payment details on receipts"
          checked={!!v.includePaymentDetailsOnReceipt}
          onChange={(x) => p.setField("includePaymentDetailsOnReceipt", x)}
          disabled={p.isPending}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Physical receipt payment details" hint="Bank / MNO details printed on physical receipts.">
            <Textarea
              rows={3}
              value={v.physicalReceiptPaymentDetails ?? ""}
              onChange={(e) => p.setField("physicalReceiptPaymentDetails", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Digital receipt payment details" hint="Shown on emailed / SMS receipts.">
            <Textarea
              rows={3}
              value={v.digitalReceiptPaymentDetails ?? ""}
              onChange={(e) => p.setField("digitalReceiptPaymentDetails", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Delivery"
        description="When and how customers get their copy."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow label="Auto-print on order close" checked={!!v.autoPrintReceipt} onChange={(x) => p.setField("autoPrintReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Auto-email customer" checked={!!v.autoEmailReceipt} onChange={(x) => p.setField("autoEmailReceipt", x)} disabled={p.isPending} />
        <SettingsSwitchRow label="Auto-SMS customer" checked={!!v.autoSmsReceipt} onChange={(x) => p.setField("autoSmsReceipt", x)} disabled={p.isPending} />
      </SettingsSection>

      <SettingsSection
        title="Invoices"
        description="Invoice numbering and payment terms. Legal identifiers (TIN, registration number) live on the business profile."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Invoice number prefix">
            <Input maxLength={50} value={v.invoiceNumberPrefix ?? ""} onChange={(e) => p.setField("invoiceNumberPrefix", e.target.value)} disabled={p.isPending} />
          </Field>
          <Field label="Default invoice due days">
            <Input
              type="number"
              min={0}
              value={v.defaultInvoiceDueDays ?? ""}
              onChange={(e) => p.setField("defaultInvoiceDueDays", e.target.value === "" ? null : Number(e.target.value))}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Default payment terms">
            <Input maxLength={100} value={v.defaultPaymentTerms ?? ""} onChange={(e) => p.setField("defaultPaymentTerms", e.target.value)} disabled={p.isPending} />
          </Field>
        </div>
        <SettingsSwitchRow
          label="Include date in invoice number"
          checked={!!v.includeDateInInvoiceNumber}
          onChange={(x) => p.setField("includeDateInInvoiceNumber", x)}
          disabled={p.isPending}
        />
      </SettingsSection>

      <SettingsSection
        title="Tax"
        description="Applied to every sale unless overridden on the product."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Default tax rate (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={v.defaultTaxRate ?? ""}
              onChange={(e) => p.setField("defaultTaxRate", e.target.value === "" ? null : Number(e.target.value))}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Tax label">
            <Input maxLength={50} value={v.taxLabel ?? ""} onChange={(e) => p.setField("taxLabel", e.target.value)} disabled={p.isPending} />
          </Field>
        </div>
        <SettingsSwitchRow
          label="Prices include tax"
          description="When on, listed prices already contain tax. When off, tax is added on top at POS."
          checked={!!v.pricesIncludeTax}
          onChange={(x) => p.setField("pricesIncludeTax", x)}
          disabled={p.isPending}
        />
      </SettingsSection>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
