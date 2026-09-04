"use client";

import { useTransition } from "react";
import {
  CalendarDays,
  FileText,
  Hash,
  Landmark,
  Percent,
  Receipt,
  Send,
  Tag,
} from "lucide-react";

import {
  ControlInput,
  ControlTextarea,
  StandaloneField as Field,
  ToggleRow,
} from "@/components/ui/field";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Button } from "@/components/ui/button";
import { SettingsSection, parseOptionalNumber } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
import { useToast } from "@/hooks/use-toast";
import { bulkSetTaxInclusive } from "@/lib/actions/product-actions";
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
  "mergeIdenticalReceiptItems",
  "showTaxOnReceipt",
  "showDiscountOnReceipt",
  "showStaffOnReceipt",
  "showCustomerOnReceipt",
  "showCustomerPhoneOnReceipt",
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

const ICON = "h-3.5 w-3.5";

export function ReceiptsInvoicingPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const { toast } = useToast();
  const [isApplying, startApply] = useTransition();

  // Persisting "prices include tax" in Accounts is only half the job: since
  // per-line tax modes it is each PRODUCT's own flag that decides whether a
  // sale has tax backed out or added on top. Push the setting into the
  // catalog so the till actually follows it.
  const applyToCatalog = (taxInclusive: boolean) => {
    startApply(async () => {
      try {
        const res = await bulkSetTaxInclusive(taxInclusive);
        const mode = taxInclusive ? "tax-inclusive" : "tax-exclusive";
        toast({
          title: res.successCount
            ? `${res.successCount} product${res.successCount === 1 ? "" : "s"} updated`
            : "Products already up to date",
          description: res.successCount
            ? `Every product at this location is now priced ${mode}.` +
              (res.failureCount ? ` ${res.failureCount} could not be updated.` : "")
            : `All products were already priced ${mode}.`,
          variant: res.failureCount ? "destructive" : undefined,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Couldn't apply to products",
          description:
            error instanceof Error
              ? error.message
              : "The setting was saved, but the product catalog was not updated.",
        });
      }
    });
  };

  const p = useSettingsPanel(KEYS, settings, onSaved, (patch) => {
    // Only when the merchant actually moved this switch — the patch carries
    // just the changed fields, so saving an unrelated receipt field never
    // rewrites the catalog.
    if ("pricesIncludeTax" in patch) {
      applyToCatalog(!!patch.pricesIncludeTax);
    }
  });
  const v = p.values;
  const d = p.isPending;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Receipts & invoicing"
        description="Receipt layout, delivery, payment-details block, invoice numbering, and default tax."
      />

      <SettingsSection
        icon={<Receipt className="h-4 w-4" />}
        title="Receipt header & footer"
        description="Header logo and the closing message. Business name and primary header come from your business profile."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Header logo"
            hint="Printed at the top of every receipt. A wide mono or black-on-white mark reproduces best on thermal paper."
            optional
          >
            {(id) => (
              <ImageDropzone
                id={id}
                purpose="RECEIPT_HEADER"
                value={v.receiptHeaderImageUrl ?? ""}
                onChange={(url) => p.setField("receiptHeaderImageUrl", url ?? "")}
                disabled={d}
                maxSizeMb={2}
                alt="Receipt header"
                ctaLabel="Upload header"
                className="min-h-[164px]"
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:col-span-2">
            <Field label="Receipt number prefix" hint="Printed before the number.">
              {(id) => (
                <ControlInput
                  id={id}
                  maxLength={50}
                  mono
                  prefix={<Tag className={ICON} />}
                  placeholder="RCP"
                  value={v.receiptNumberPrefix ?? ""}
                  onChange={(e) => p.setField("receiptNumberPrefix", e.target.value)}
                  disabled={d}
                />
              )}
            </Field>
            <Field label="Receipt number suffix" hint="Printed after the number.">
              {(id) => (
                <ControlInput
                  id={id}
                  maxLength={50}
                  mono
                  prefix={<Tag className={ICON} />}
                  value={v.receiptNumberSuffix ?? ""}
                  onChange={(e) => p.setField("receiptNumberSuffix", e.target.value)}
                  disabled={d}
                />
              )}
            </Field>
            <Field
              label="Footer text"
              hint="The closing line, e.g. a thank-you or a returns note."
              optional
              className="sm:col-span-2"
            >
              {(id) => (
                <ControlTextarea
                  id={id}
                  rows={3}
                  placeholder="Asante sana! Goods once sold are returnable within 7 days with this receipt."
                  value={v.receiptFooterText ?? ""}
                  onChange={(e) => p.setField("receiptFooterText", e.target.value)}
                  disabled={d}
                />
              )}
            </Field>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<FileText className="h-4 w-4" />}
        title="Receipt content"
        description="What prints or emails on each receipt. The QR code is generated per receipt automatically."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Itemised line items"
            hint="List every line instead of a single total."
            checked={!!v.showItemizedReceipt}
            onChange={(x) => p.setField("showItemizedReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Merge identical items"
            hint="Combine repeats with the same price and modifiers into one quantity line."
            checked={!!v.mergeIdenticalReceiptItems}
            onChange={(x) => p.setField("mergeIdenticalReceiptItems", x)}
            disabled={d}
          />
          <ToggleRow
            label="Tax breakdown"
            hint="Show tax split out beneath the total."
            checked={!!v.showTaxOnReceipt}
            onChange={(x) => p.setField("showTaxOnReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Discount lines"
            hint="Show each discount applied to the order."
            checked={!!v.showDiscountOnReceipt}
            onChange={(x) => p.setField("showDiscountOnReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Cashier name"
            hint="Print who served the order."
            checked={!!v.showStaffOnReceipt}
            onChange={(x) => p.setField("showStaffOnReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Customer name"
            hint="Print the customer the order is attached to."
            checked={!!v.showCustomerOnReceipt}
            onChange={(x) => p.setField("showCustomerOnReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Customer phone number"
            hint="Print the customer's phone beneath their name."
            checked={!!v.showCustomerPhoneOnReceipt}
            onChange={(x) => p.setField("showCustomerPhoneOnReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Item images"
            hint="Only on digital receipts and the modern layout."
            checked={!!v.showImageOnReceipt}
            onChange={(x) => p.setField("showImageOnReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="QR code"
            hint="Links the customer to the digital copy."
            checked={!!v.showQrCodeOnReceipt}
            onChange={(x) => p.setField("showQrCodeOnReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Extra details on printed receipts"
            hint="Adds order metadata to the paper copy."
            checked={!!v.showAdditionalDetailsOnPhysicalReceipt}
            onChange={(x) => p.setField("showAdditionalDetailsOnPhysicalReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Extra details on digital receipts"
            hint="Adds order metadata to emailed and SMS copies."
            checked={!!v.showAdditionalDetailsOnDigitalReceipt}
            onChange={(x) => p.setField("showAdditionalDetailsOnDigitalReceipt", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Landmark className="h-4 w-4" />}
        title="Payment details on receipts"
        description="Bank or mobile-money details the customer can pay into, shown on the receipt."
      >
        <ToggleRow
          label="Include payment details"
          hint="Off hides the block on every receipt, whatever the text below says."
          checked={!!v.includePaymentDetailsOnReceipt}
          onChange={(x) => p.setField("includePaymentDetailsOnReceipt", x)}
          disabled={d}
        />
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
          <Field label="Printed receipts" hint="Kept short — thermal paper is narrow.">
            {(id) => (
              <ControlTextarea
                id={id}
                rows={3}
                placeholder="CRDB 0150xxxxxxx — Kariakoo Traders"
                value={v.physicalReceiptPaymentDetails ?? ""}
                onChange={(e) =>
                  p.setField("physicalReceiptPaymentDetails", e.target.value)
                }
                disabled={d || !v.includePaymentDetailsOnReceipt}
              />
            )}
          </Field>
          <Field label="Digital receipts" hint="Shown on emailed and SMS receipts.">
            {(id) => (
              <ControlTextarea
                id={id}
                rows={3}
                placeholder="M-Pesa Lipa namba 123456, or CRDB 0150xxxxxxx"
                value={v.digitalReceiptPaymentDetails ?? ""}
                onChange={(e) =>
                  p.setField("digitalReceiptPaymentDetails", e.target.value)
                }
                disabled={d || !v.includePaymentDetailsOnReceipt}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Send className="h-4 w-4" />}
        title="Delivery"
        description="When and how customers get their copy."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ToggleRow
            label="Auto-print on close"
            hint="Print the receipt the moment the order closes."
            checked={!!v.autoPrintReceipt}
            onChange={(x) => p.setField("autoPrintReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Auto-email customer"
            hint="Needs an email on the customer record."
            checked={!!v.autoEmailReceipt}
            onChange={(x) => p.setField("autoEmailReceipt", x)}
            disabled={d}
          />
          <ToggleRow
            label="Auto-SMS customer"
            hint="Needs a phone number on the customer record."
            checked={!!v.autoSmsReceipt}
            onChange={(x) => p.setField("autoSmsReceipt", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Hash className="h-4 w-4" />}
        title="Invoices"
        description="Invoice numbering and payment terms. Legal identifiers such as TIN live on the business profile."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Invoice number prefix" hint="Printed before the number.">
            {(id) => (
              <ControlInput
                id={id}
                maxLength={50}
                mono
                prefix={<Tag className={ICON} />}
                placeholder="INV"
                value={v.invoiceNumberPrefix ?? ""}
                onChange={(e) => p.setField("invoiceNumberPrefix", e.target.value)}
                disabled={d}
              />
            )}
          </Field>
          <Field label="Default due days" hint="Added to the issue date to set the due date.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={0}
                suffix="days"
                prefix={<CalendarDays className={ICON} />}
                placeholder="30"
                value={v.defaultInvoiceDueDays ?? ""}
                onChange={(e) =>
                  p.setField("defaultInvoiceDueDays", parseOptionalNumber(e.target.value))
                }
                disabled={d}
              />
            )}
          </Field>
          <Field label="Default payment terms" hint="Free text printed on the invoice.">
            {(id) => (
              <ControlInput
                id={id}
                maxLength={100}
                prefix={<FileText className={ICON} />}
                placeholder="Net 30"
                value={v.defaultPaymentTerms ?? ""}
                onChange={(e) => p.setField("defaultPaymentTerms", e.target.value)}
                disabled={d}
              />
            )}
          </Field>
        </div>
        <ToggleRow
          label="Include date in invoice number"
          hint="Adds the issue date to the generated number."
          checked={!!v.includeDateInInvoiceNumber}
          onChange={(x) => p.setField("includeDateInInvoiceNumber", x)}
          disabled={d}
        />
      </SettingsSection>

      <SettingsSection
        icon={<Percent className="h-4 w-4" />}
        title="Tax"
        description="Applied to every sale unless overridden on the product."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Default tax rate">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="decimal"
                mono
                min={0}
                max={100}
                suffix="%"
                prefix={<Percent className={ICON} />}
                placeholder="18"
                value={v.defaultTaxRate ?? ""}
                onChange={(e) =>
                  p.setField("defaultTaxRate", parseOptionalNumber(e.target.value))
                }
                disabled={d}
              />
            )}
          </Field>
          <Field label="Tax label" hint="How tax is named on receipts, e.g. VAT.">
            {(id) => (
              <ControlInput
                id={id}
                maxLength={50}
                prefix={<Tag className={ICON} />}
                placeholder="VAT"
                value={v.taxLabel ?? ""}
                onChange={(e) => p.setField("taxLabel", e.target.value)}
                disabled={d}
              />
            )}
          </Field>
        </div>

        <ToggleRow
          label="Prices include tax"
          hint="On, listed prices already contain tax. Off, tax is added on top at the POS. Saving applies this to every product at this location."
          checked={!!v.pricesIncludeTax}
          onChange={(x) => p.setField("pricesIncludeTax", x)}
          disabled={d || isApplying}
        />

        {/*
          Re-apply without touching the switch. Needed because the setting and
          the catalog can disagree while the switch sits still — a migration
          from the old monolith carries each product's legacy tax_included
          value through verbatim, so a location can read "prices include tax"
          here while its products are all priced exclusive underneath.
        */}
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-medium leading-tight text-ink">
              Apply to existing products
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
              Brings every product at this location in line with the switch
              above. Products already set are left alone.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            disabled={d || isApplying}
            onClick={() => applyToCatalog(!!v.pricesIncludeTax)}
          >
            {isApplying ? "Applying…" : "Apply to all"}
          </Button>
        </div>
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
