import { format, subDays } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { fetchGeneralLedger } from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { GeneralLedgerPicker } from "./general-ledger-picker";

interface SearchParams {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function GeneralLedgerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const startDate = params.startDate ?? format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endDate = params.endDate ?? today;
  const accountId = params.accountId ?? "";

  const location = await getCurrentLocation();
  const report = location?.id && accountId
    ? await fetchGeneralLedger(accountId, location.id, startDate, endDate)
    : null;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "General ledger" },
        ]}
      />
      <PageHeader
        title="General ledger"
        subtitle="Chronological journal lines hitting an account, with running balance."
      />
      <PageBody>
        <Card>
          <CardContent className="pt-6">
            <GeneralLedgerPicker
              defaultAccountId={accountId}
              defaultStartDate={startDate}
              defaultEndDate={endDate}
            />
          </CardContent>
        </Card>

        {!accountId ? (
          <NoItems itemName="account selected — pick one above" />
        ) : !report ? (
          <NoItems itemName="entries for the chosen account" />
        ) : (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <Stat label="Account" value={`${report.accountCode} · ${report.accountName}`} />
                <Stat label="Opening balance" value={fmt(report.openingBalance)} />
                <Stat label="Closing balance" value={fmt(report.closingBalance)} />
                <Stat
                  label="Period activity"
                  value={`Dr ${fmt(report.totalDebit)} / Cr ${fmt(report.totalCredit)}`}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Entry</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Credit</th>
                      <th className="px-4 py-3 text-right">Running</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.entries.map((e) => (
                      <tr key={`${e.journalEntryId}-${e.entryNumber}`} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs">
                          {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                          }).format(new Date(e.entryDate))}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {e.entryNumber}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {e.description ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {e.debit > 0 ? fmt(e.debit) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {e.credit > 0 ? fmt(e.credit) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                          {fmt(e.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
