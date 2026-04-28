import { BusinessDocumentData } from "./types";
import { DocumentHeader } from "./sections/DocumentHeader";
import { DocumentMetaBlock } from "./sections/DocumentMetaBlock";
import { LineItemsTable } from "./sections/LineItemsTable";
import { TotalsSummary } from "./sections/TotalsSummary";
import { NotesFooter } from "./sections/NotesFooter";

export interface DocumentTheme {
  /** Hex (or any CSS colour) used for the items-table header background. */
  primaryColor?: string;
  /** Reserved for future use (header underline, signature lines, etc.). */
  secondaryColor?: string;
}

interface BusinessDocumentProps {
  data: BusinessDocumentData;
  /**
   * Tailwind class for the items-table header background. Lets each tenant
   * brand the document without forking the component.
   * Default: "bg-blue-700". Ignored when {@link theme}.primaryColor is set.
   */
  tableHeaderClassName?: string;
  /**
   * Per-tenant brand colours. When set, takes precedence over the Tailwind
   * fallback so dynamic hex values from the location/whitelabel resolve
   * correctly without needing JIT class generation.
   */
  theme?: DocumentTheme;
  /**
   * Optional outer className — useful for sizing the page (e.g. A4 in print).
   */
  className?: string;
}

/**
 * The single, unified document template used across the platform for
 * invoices, receipts, purchase orders, requisitions, quotes, etc.
 *
 * Pass any `BusinessDocumentData` and this component renders the matching
 * layout. To customize per document type, set `meta.type` and provide the
 * sections you need (e.g. `signatures` for purchase orders, `bankDetails`
 * for invoices, `totals.payments` for receipts).
 */
export function BusinessDocument({
  data,
  tableHeaderClassName,
  theme,
  className = "",
}: BusinessDocumentProps) {
  const headerStyle = theme?.primaryColor
    ? { backgroundColor: theme.primaryColor }
    : undefined;
  return (
    <article
      className={`mx-auto flex flex-col bg-white text-slate-900 shadow-sm print:shadow-none ${className}`}
      data-document-type={data.meta.type}
    >
      <DocumentHeader
        issuer={data.issuer}
        meta={data.meta}
        titleColor={theme?.primaryColor}
      />
      <DocumentMetaBlock
        recipient={data.recipient}
        meta={data.meta}
        totals={data.totals}
        currency={data.currency}
      />
      <LineItemsTable
        items={data.items}
        currency={data.currency}
        headerClassName={tableHeaderClassName}
        headerStyle={headerStyle}
      />
      <TotalsSummary totals={data.totals} currency={data.currency} />
      <NotesFooter
        notes={data.notes}
        bankDetails={data.bankDetails}
        signatures={data.signatures}
        footerMessage={data.footerMessage}
      />
    </article>
  );
}

export type { BusinessDocumentData } from "./types";
