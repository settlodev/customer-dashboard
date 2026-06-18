import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { UpgradeGate } from "@/components/widgets/upgrade-gate";
import { Department } from "@/types/department/type";
import { getDepartment } from "@/lib/actions/department-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getItemSalesSummary } from "@/lib/actions/item-sales-actions";
import { fetchAllProducts } from "@/lib/actions/product-actions";
import { hasEntityFeature } from "@/lib/actions/entitlement-actions";
import {
  DepartmentDetailView,
  type DepartmentProductSale,
} from "./department-detail-view";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string; from?: string; to?: string }>;

export default async function DepartmentPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { tab, from: fromParam, to: toParam } = await searchParams;

  // Adding a department is a sibling route now that /departments/[id] is a
  // detail view; editing moved to /departments/[id]/edit.
  if (id === "new") redirect("/departments/new");

  // Sales period — defaults to the current month, matching the report hub.
  const now = new Date();
  const from = fromParam ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = toParam ?? format(endOfMonth(now), "yyyy-MM-dd");

  const location = await getCurrentLocation().catch(() => null);

  // DEPARTMENTS_MODULE entitlement gate — mirrors the /departments list page.
  if (location?.id) {
    const allowed = await hasEntityFeature(location.id, "DEPARTMENTS_MODULE");
    if (!allowed) {
      return (
        <PageShell>
          <PageBreadcrumbs
            items={[
              { title: "Departments", href: "/departments" },
              { title: "Details" },
            ]}
          />
          <PageHeader title="Department" />
          <PageBody>
            <UpgradeGate
              featureName="Departments"
              description="Multi-department management is available on Professional and Enterprise plans. Your location still has a default Main department for day-to-day use."
            />
          </PageBody>
        </PageShell>
      );
    }
  }

  let department: Department | null = null;
  try {
    department = await getDepartment(id);
    if (!department) notFound();
  } catch {
    notFound();
  }

  // Sales for this department's products over the selected period. Item sales
  // are per-product, so join to the products whose categories roll up to this
  // department. (Multi-attribution: a product can span several departments.)
  const currency = await getLocationCurrency().catch(() => "TZS");

  const [summary, products] = await Promise.all([
    location?.id
      ? getItemSalesSummary(location.id, from, to)
      : Promise.resolve(null),
    fetchAllProducts().catch(() => []),
  ]);

  // Aggregate item sales per product.
  const byProduct = new Map<
    string,
    {
      qty: number;
      gross: number;
      net: number;
      cost: number;
      profit: number;
      discount: number;
    }
  >();
  for (const it of summary?.items ?? []) {
    const cur = byProduct.get(it.productId) ?? {
      qty: 0,
      gross: 0,
      net: 0,
      cost: 0,
      profit: 0,
      discount: 0,
    };
    cur.qty += it.quantitySold;
    cur.gross += it.grossSales;
    cur.net += it.netSales;
    cur.cost += it.totalCost;
    cur.profit += it.grossProfit;
    cur.discount += it.totalDiscount;
    byProduct.set(it.productId, cur);
  }

  // Products whose categories roll up to this department, with their sales
  // (zeros if none sold in the window).
  const productSales: DepartmentProductSale[] = products
    .filter((p) => (p.categories ?? []).some((c) => c.departmentId === id))
    .map((p) => {
      const s = byProduct.get(p.id);
      return {
        productId: p.id,
        name: p.name,
        quantitySold: s?.qty ?? 0,
        grossSales: s?.gross ?? 0,
        netSales: s?.net ?? 0,
        totalCost: s?.cost ?? 0,
        grossProfit: s?.profit ?? 0,
        totalDiscount: s?.discount ?? 0,
      };
    })
    .sort((a, b) => b.netSales - a.netSales);

  const statusLabel = department.active ? "Active" : "Inactive";
  const statusClass = department.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Departments", href: "/departments" },
          { title: department.name },
        ]}
      />
      <PageHeader
        title={department.name}
        titleAccessory={
          <span className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
            {department.isDefault && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                Default
              </span>
            )}
          </span>
        }
        subtitle={department.description ?? undefined}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/departments/${department.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <PageBody>
        <DepartmentDetailView
          department={department}
          productSales={productSales}
          currency={currency}
          from={from}
          to={to}
          initialTab={tab}
        />
      </PageBody>
    </PageShell>
  );
}
