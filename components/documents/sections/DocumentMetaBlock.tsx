import { DocumentMeta, DocumentTotals, Party } from "../types";
import {
  formatCurrency,
  formatLongDate,
  getDocumentNumberLabel,
  getIssueDateLabel,
  getRecipientLabel,
} from "../utils/format";

interface DocumentMetaBlockProps {
  recipient?: Party;
  meta: DocumentMeta;
  totals: DocumentTotals;
  currency: string;
}

const STATUS_TONE_CLASSES: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-700",
};

export function DocumentMetaBlock({
  recipient,
  meta,
  totals,
  currency,
}: DocumentMetaBlockProps) {
  const recipientLabel = getRecipientLabel(meta.type);
  const numberLabel = getDocumentNumberLabel(meta.type);
  const issueDateLabel = getIssueDateLabel(meta.type);
  const statusClass =
    meta.status?.tone && STATUS_TONE_CLASSES[meta.status.tone]
      ? STATUS_TONE_CLASSES[meta.status.tone]
      : STATUS_TONE_CLASSES.neutral;

  return (
    <section className="grid grid-cols-1 gap-8 px-10 py-6 md:grid-cols-2">
      {/* Recipient block — only render when an external party is provided */}
      {recipient?.name ? (
        <div className="text-xs leading-relaxed">
          <div className="mb-1.5 font-medium text-slate-500">{recipientLabel}</div>
          <div className="text-sm font-medium text-slate-900">{recipient.name}</div>
          {recipient.contactPerson && (
            <div className="text-slate-600">{recipient.contactPerson}</div>
          )}
          {recipient.addressLines?.map((line, idx) => (
            <div key={idx} className="text-slate-600">
              {line}
            </div>
          ))}
          {(recipient.phone || recipient.email) && (
            <div className="mt-2 text-slate-600">
              {recipient.phone && <div>{recipient.phone}</div>}
              {recipient.email && <div>{recipient.email}</div>}
            </div>
          )}
          {recipient.tin && (
            <div className="mt-1 text-slate-600">TIN: {recipient.tin}</div>
          )}
        </div>
      ) : (
        <div />
      )}

      {/* Meta block */}
      <div className="text-xs">
        <dl className="space-y-1.5">
          <MetaRow label={`${numberLabel}:`} value={meta.documentNumber} />
          <MetaRow
            label={`${issueDateLabel}:`}
            value={formatLongDate(meta.issueDate)}
          />
          {meta.dueDate && (
            <MetaRow label="Payment Due:" value={formatLongDate(meta.dueDate)} />
          )}
          {meta.referenceNumber && (
            <MetaRow label="Reference:" value={meta.referenceNumber} />
          )}
          {meta.status && (
            <div className="flex items-center justify-end gap-2 pt-1">
              <span className={`rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusClass}`}>
                {meta.status.label}
              </span>
            </div>
          )}
        </dl>

        <div className="mt-3 flex items-center justify-between bg-slate-100 px-3 py-2">
          <span className="font-medium text-slate-900">
            Amount Due ({currency}):
          </span>
          <span className="font-medium text-slate-900">
            {formatCurrency(totals.amountDue, currency)}
          </span>
        </div>
      </div>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
