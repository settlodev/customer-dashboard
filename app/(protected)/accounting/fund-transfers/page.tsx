import Link from "next/link";
import { ArrowRightLeft, CircleDollarSign, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { listFundTransfers } from "@/lib/actions/fund-transfer-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default async function FundTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 0;
  const size = Number(params.limit) || 20;

  const location = await getCurrentLocation();
  const response = location?.id
    ? await listFundTransfers(location.id, page, size)
    : null;
  const data = response?.content ?? [];
  const total = response?.totalElements ?? 0;
  const sumOnPage = data.reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Accounting" }, { title: "Fund transfers" }]}
      />
      <PageHeader
        title="Fund transfers"
        subtitle="Move money between asset accounts — auto-posts a balanced JE."
        actions={
          <Button asChild size="sm">
            <Link href="/accounting/fund-transfers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New transfer
            </Link>
          </Button>
        }
      />
      <PageBody>
        {data.length === 0 ? (
          <NoItems
            itemName="fund transfers"
            newItemUrl="/accounting/fund-transfers/new"
          />
        ) : (
          <>
            <KpiStrip cols={2}>
              <KpiCard
                icon={<ArrowRightLeft className="h-3 w-3" />}
                label="Transfers (page)"
                value={String(data.length)}
                delta={`of ${total} total`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Volume on page"
                value={fmt(sumOnPage)}
                unit={data[0]?.currencyCode ?? ""}
              />
            </KpiStrip>
            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">From</th>
                        <th className="px-4 py-3">To</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-xs">
                            {new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                            }).format(new Date(t.transferDate))}
                          </td>
                          <td className="px-4 py-3">
                            {t.fromAccountName ?? t.fromAccountCode ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {t.toAccountName ?? t.toAccountCode ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {t.description ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(t.amount)} {t.currencyCode}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}
