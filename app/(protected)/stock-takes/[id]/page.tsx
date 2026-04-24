import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { getStockTake } from "@/lib/actions/stock-take-actions";
import {
  STOCK_TAKE_STATUS_LABELS,
  STOCK_TAKE_STATUS_TONES,
  CYCLE_COUNT_TYPE_LABELS,
  describeFilterCriteria,
} from "@/types/stock-take/type";
import { StockTakeStatusActions } from "@/components/widgets/stock-take/status-actions";
import StockTakeItemsTable from "@/components/widgets/stock-take/items-table";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";
import { FileText, UserCheck } from "lucide-react";

type Params = Promise<{ id: string }>;

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default async function StockTakeDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const stockTake = await getStockTake(id);
  if (!stockTake) notFound();

  const blindCount = Boolean(stockTake.blindCount);
  const readOnly =
    stockTake.status !== "IN_PROGRESS";
  const scopeDescription = describeFilterCriteria(
    stockTake.cycleCountType,
    stockTake.filterCriteria,
  );
  const hasBins = stockTake.items.some((item) => item.binCode);

  const breadcrumbItems = [
    { title: "Stock Takes", link: "/stock-takes" },
    { title: stockTake.takeNumber, link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{stockTake.takeNumber}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STOCK_TAKE_STATUS_TONES[stockTake.status]}`}
            >
              {STOCK_TAKE_STATUS_LABELS[stockTake.status]}
            </span>
            {blindCount && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700">
                Blind count
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {scopeDescription
              ?? (stockTake.cycleCountType
                ? CYCLE_COUNT_TYPE_LABELS[stockTake.cycleCountType]
                : "Full count")}
            {" · "}
            Created {formatDateTime(stockTake.createdAt)}
          </p>
        </div>
        <StockTakeStatusActions stockTake={stockTake} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Meta label="Items" value={String(stockTake.totalItems)} />
        <Meta
          label="Counted"
          value={`${stockTake.itemsCounted} / ${stockTake.totalItems} (${
            stockTake.totalItems > 0
              ? Math.round((stockTake.itemsCounted / stockTake.totalItems) * 100)
              : 0
          }%)`}
        />
        <Meta
          label="With variance"
          value={String(stockTake.itemsWithVariance)}
          tone={stockTake.itemsWithVariance > 0 ? "warn" : "good"}
        />
        <Meta label="Started" value={formatDateTime(stockTake.startedAt)} />
      </div>

      {(stockTake.startedByName ||
        stockTake.completedByName ||
        stockTake.approvedByName) && (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {stockTake.startedByName && (
              <Field
                Icon={UserCheck}
                label="Started"
                who={stockTake.startedByName}
                when={formatDateTime(stockTake.startedAt)}
              />
            )}
            {stockTake.completedByName && (
              <Field
                Icon={UserCheck}
                label="Completed"
                who={stockTake.completedByName}
                when={formatDateTime(stockTake.completedAt)}
              />
            )}
            {stockTake.approvedByName && (
              <Field
                Icon={UserCheck}
                label="Approved"
                who={stockTake.approvedByName}
                when={formatDateTime(stockTake.approvedAt)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {stockTake.items.length === 0 ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {stockTake.status === "DRAFT"
              ? "Start the stock take to populate items from current inventory."
              : "No items in this stock take."}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="px-2 sm:px-6 pt-6 pb-4">
            <h3 className="text-lg font-medium mb-4">Counts</h3>
            <StockTakeItemsTable
              takeId={stockTake.id}
              items={stockTake.items}
              blindCount={blindCount}
              readOnly={readOnly}
              hasBins={hasBins}
            />
          </CardContent>
        </Card>
      )}

      <AttachmentsPanel
        entityType="STOCK_TAKE"
        entityId={stockTake.id}
        description="Count sheets, auditor signatures, photographic evidence. Max 10 MB per file."
      />

      {stockTake.notes && (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{stockTake.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Meta({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-green-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-gray-900";
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className={`mt-1 text-base font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({
  Icon,
  label,
  who,
  when,
}: {
  Icon: typeof UserCheck;
  label: string;
  who: string;
  when: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
        <p className="font-medium">{who}</p>
        <p className="text-xs text-muted-foreground">{when}</p>
      </div>
    </div>
  );
}
