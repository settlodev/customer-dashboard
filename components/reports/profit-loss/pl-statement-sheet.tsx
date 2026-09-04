import { DocumentHeader } from "@/components/documents/sections/DocumentHeader";
import type { BusinessIdentity, DocumentMeta } from "@/components/documents/types";
import {
  PlStatementTable,
  fmtSigned,
} from "@/components/reports/profit-loss/pl-statement-table";
import { composeLetterheadAddress } from "@/lib/grn-document";
import { isDisplayableImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";
import type { PublicMonthlyProfitLoss } from "@/types/reports/type";

const formatGeneratedAt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * The month-end statement as a printable document: the shared letterhead
 * header, the three headline figures, the IAS 1 statement table, and a
 * footer stamping when it was frozen. Rendered inside PrintableDocument by
 * the public share page.
 */
export function PlStatementSheet({ report }: { report: PublicMonthlyProfitLoss }) {
  const lh = report.letterhead;
  const issuer: BusinessIdentity = {
    name: lh?.businessName ?? "Business",
    logoUrl: isDisplayableImageUrl(lh?.logoUrl) ? lh.logoUrl : undefined,
    addressLines: composeLetterheadAddress(
      lh
        ? {
            businessName: lh.businessName,
            locationName: lh.locationName,
            addressLine: lh.addressLine,
            street: null,
            ward: null,
            district: null,
            city: lh.city,
            region: lh.region,
            postalCode: null,
            countryName: lh.country,
            countryCode: null,
            phone: lh.phone,
            email: lh.email,
            website: lh.website,
            logoUrl: lh.logoUrl,
          }
        : null,
    ),
    phone: lh?.phone ?? undefined,
    email: lh?.email ?? undefined,
    website: lh?.website ?? undefined,
    tin: lh?.tin ?? undefined,
    vrn: lh?.vrn ?? undefined,
  };
  const meta: DocumentMeta = {
    type: "statement",
    titleOverride: "Profit & Loss Statement",
    documentNumber: `${report.periodYear}-${String(report.periodMonth).padStart(2, "0")}`,
    issueDate: report.endDate,
  };

  const headline = [
    { label: "Gross profit", value: report.grossProfit },
    { label: "Operating profit", value: report.operatingProfit },
    { label: "Net profit after tax", value: report.netProfitAfterTax },
  ];

  return (
    <>
      <DocumentHeader issuer={issuer} meta={meta} />

      <div className="px-10 pb-2 pt-7">
        <div className="text-[12.5px] text-slate-500">
          {lh?.locationName ? `${lh.locationName} · ` : ""}For the month of{" "}
          <span className="font-semibold text-slate-800">{report.periodLabel}</span>
          {" · "}
          {report.startDate} to {report.endDate} · {report.currencyCode}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-10 pb-6 pt-4">
        {headline.map((h) => (
          <div key={h.label} className="rounded-lg border border-slate-200 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {h.label}
            </div>
            <div
              className={cn(
                "mt-1 font-mono text-lg font-semibold tabular-nums",
                h.value < 0 ? "text-red-700" : "text-emerald-700",
              )}
            >
              {fmtSigned(h.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="px-10 pb-8">
        <PlStatementTable
          sections={report.sections}
          grossProfit={report.grossProfit}
          operatingProfit={report.operatingProfit}
          netProfitBeforeTax={report.netProfitBeforeTax}
          netProfitAfterTax={report.netProfitAfterTax}
          currencyCode={report.currencyCode}
        />
      </div>

      <footer className="border-t border-slate-200 px-10 py-6 text-[12px] leading-relaxed text-slate-500">
        Generated {formatGeneratedAt(report.generatedAt)} from posted journals. Figures are as at
        generation; amounts in brackets are negative.
        {report.liveUrl && (
          <>
            {" "}
            <a href={report.liveUrl} className="font-semibold text-slate-700 underline print:hidden">
              Open the live statement
            </a>{" "}
            <span className="print:hidden">for postings made since.</span>
          </>
        )}
      </footer>
    </>
  );
}
