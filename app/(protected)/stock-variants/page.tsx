import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-variants/column";
import { searchStockVariants } from "@/lib/actions/stock-variant-actions";
import { StockVariant } from "@/types/stockVariant/type";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {
  Plus,
  ArrowDownToLine,
  FileSignature,
  ArrowLeftRight,
  PackageOpen,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import { CSVStockDialog } from "@/components/csv/stockCsvImport";
import { ProductWithStockCSVDialog } from "@/components/csv/ProductWithStockCsvImport";

const breadcrumbItems = [{ title: "Stock Items", link: "/stock-variants" }];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function StockVariantPage({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const responseData = await searchStockVariants(q, page, pageLimit);

  const data: StockVariant[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  const isEmpty = total === 0 && q === "";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/stock-intakes/new">
              <ArrowDownToLine className="mr-1.5 h-4 w-4" />
              Intake
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/stock-modifications/new">
              <FileSignature className="mr-1.5 h-4 w-4" />
              Modify
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/stock-transfers/new">
              <ArrowLeftRight className="mr-1.5 h-4 w-4" />
              Transfer
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/stocks/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Stock
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isEmpty ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="stockAndStockVariantName"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              rowClickBasePath="/stock-variants"
            />
          </CardContent>
        </Card>
      ) : (
        <StockEmptyState />
      )}
    </div>
  );
}

function StockEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <PackageOpen className="w-8 h-8 text-gray-400" />
      </div>

      {/* Copy */}
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        No stock items yet
      </h2>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-10">
        Get started by adding stock manually or import your existing inventory
        in bulk using a CSV file.
      </p>

      {/* ── Add manually CTA ── */}
      <Button size="sm" className="mb-10" asChild>
        <Link href="/stocks/new">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Stock Manually
        </Link>
      </Button>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 w-full max-w-xl mb-8">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          or import in bulk
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* ── Import option cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {/* Stock only */}
        <div className="group relative flex flex-col bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileSpreadsheet className="w-4.5 h-4.5 text-gray-600" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Stock only
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            Import Stock CSV
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">
            Upload stock items and quantities from a CSV. Use this if your
            products are already set up in the system.
          </p>
          <CSVStockDialog uploadType="location" />
        </div>

        {/* Stock + Products */}
        <div className="group relative flex flex-col bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <Layers className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              Recommended
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            Import Stock & Products
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">
            Upload products and their linked stock together in one go. Perfect
            for setting up a brand-new inventory from scratch.
          </p>
          <ProductWithStockCSVDialog />
        </div>
      </div>
    </div>
  );
}
