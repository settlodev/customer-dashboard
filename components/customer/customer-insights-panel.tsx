"use client";

import Link from "next/link";
import { BarChart3, ShoppingBag, Tag } from "lucide-react";

import {
  DetailTable,
  DetailTableBody,
  DetailTableHead,
  DetailTd,
  DetailTh,
  EmptyState,
  PanelCard,
} from "@/components/layouts/order-detail";
import { CustomerSpendChart } from "@/components/customer/customer-spend-chart";
import { formatDate } from "@/lib/format-datetime";
import type {
  CustomerFavourite,
  CustomerInsights,
} from "@/types/customer/type";

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

const fmtQty = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);

/**
 * The Insights tab — what the Reports Service knows about this customer at
 * this location beyond the ledger: spend by month, and what they keep
 * buying. Behaviour (segment, cadence, trend) lives in the rail next to the
 * balance so it is always in view.
 */
export function CustomerInsightsPanel({
  insights,
  currency,
}: {
  insights: CustomerInsights | null;
  currency: string;
}) {
  if (!insights) {
    return (
      <PanelCard icon={<BarChart3 className="h-3.5 w-3.5" />} title="Insights" pad0>
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title="Insights unavailable"
          sub="The analytics service could not be reached. The ledger and balance are unaffected."
        />
      </PanelCard>
    );
  }

  const monthly = insights.monthly ?? [];
  const totalNet = monthly.reduce((s, p) => s + (p.net ?? 0), 0);
  const totalOrders = monthly.reduce((s, p) => s + (p.orders ?? 0), 0);
  const totalProfit = monthly.reduce((s, p) => s + (p.grossProfit ?? 0), 0);
  const activeMonths = monthly.filter((p) => p.orders > 0).length;

  return (
    <div className="flex flex-col gap-3.5">
      <PanelCard
        icon={<BarChart3 className="h-3.5 w-3.5" />}
        title="Spend by month"
        actions={
          <span className="font-mono text-[10.5px] uppercase tracking-[0.03em] text-muted-foreground">
            Last 12 months
          </span>
        }
      >
        {totalOrders === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-5 w-5" />}
            title="No revenue in the last year"
            sub="Completed sales for this customer at this location will chart here month by month."
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <div className="text-[24px] font-bold tracking-[-0.03em] text-ink">
                <span className="mr-1 font-mono text-[12px] font-semibold text-muted-foreground">
                  {currency}
                </span>
                {fmt(totalNet)}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {totalOrders.toLocaleString()} {totalOrders === 1 ? "order" : "orders"} ·{" "}
                {activeMonths} of 12 months active ·{" "}
                <span className="text-pos">{fmt(totalProfit)} gross profit</span>
              </div>
            </div>
            <CustomerSpendChart monthly={monthly} currency={currency} />
          </>
        )}
      </PanelCard>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        <FavouritesCard
          icon={<ShoppingBag className="h-3.5 w-3.5" />}
          title="Favourite items"
          rows={insights.favouriteItems ?? []}
          currency={currency}
          linkBase="/products"
          empty="Items this customer buys most will rank here."
        />
        <FavouritesCard
          icon={<Tag className="h-3.5 w-3.5" />}
          title="Favourite categories"
          rows={insights.favouriteCategories ?? []}
          currency={currency}
          empty="Categories this customer buys from most will rank here."
        />
      </div>
    </div>
  );
}

function FavouritesCard({
  icon,
  title,
  rows,
  currency,
  linkBase,
  empty,
}: {
  icon: React.ReactNode;
  title: string;
  rows: CustomerFavourite[];
  currency: string;
  /** When set, a row with an id links to `${linkBase}/${id}`. */
  linkBase?: string;
  empty: string;
}) {
  return (
    <PanelCard icon={icon} title={title} count={rows.length || undefined} pad0>
      {rows.length === 0 ? (
        <EmptyState icon={icon} title="Nothing yet" sub={empty} />
      ) : (
        <DetailTable>
          <DetailTableHead>
            <DetailTh>Name</DetailTh>
            <DetailTh align="right">Qty</DetailTh>
            <DetailTh align="right">Orders</DetailTh>
            <DetailTh align="right">Net ({currency})</DetailTh>
            <DetailTh align="right">Last</DetailTh>
          </DetailTableHead>
          <DetailTableBody>
            {rows.map((r, i) => {
              const href = linkBase && r.id ? `${linkBase}/${r.id}` : null;
              return (
                <tr key={`${r.name}-${i}`}>
                  <DetailTd>
                    <span className="flex items-center gap-2">
                      <span className="w-4 shrink-0 font-mono text-[10.5px] text-muted-foreground">
                        {i + 1}
                      </span>
                      {href ? (
                        <Link
                          href={href}
                          className="font-medium text-ink hover:text-primary hover:underline"
                        >
                          {r.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-ink">{r.name}</span>
                      )}
                    </span>
                  </DetailTd>
                  <DetailTd align="right" strong>
                    {fmtQty(r.quantity)}
                  </DetailTd>
                  <DetailTd align="right">{r.orders}</DetailTd>
                  <DetailTd align="right">{fmt(r.net)}</DetailTd>
                  <DetailTd align="right" dim={!r.lastBought}>
                    {formatDate(r.lastBought) || "—"}
                  </DetailTd>
                </tr>
              );
            })}
          </DetailTableBody>
        </DetailTable>
      )}
    </PanelCard>
  );
}
