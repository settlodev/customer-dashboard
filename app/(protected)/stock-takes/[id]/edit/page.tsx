import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import StockTakeForm from "@/components/forms/stock-take-form";
import { getStockTake } from "@/lib/actions/stock-take-actions";
import type { CreateStockTakeInput } from "@/types/stock-take/schema";
import type { StockTake } from "@/types/stock-take/type";

type Params = Promise<{ id: string }>;

export default async function EditStockTakePage({ params }: { params: Params }) {
  const { id } = await params;
  const stockTake = await getStockTake(id);
  if (!stockTake) notFound();
  if (stockTake.status !== "DRAFT") {
    // Editing is only valid on DRAFT — send user back to the detail page.
    return notFound();
  }

  const initial = toFormValues(stockTake);

  const breadcrumbItems = [
    { title: "Stock Takes", link: "/stock-takes" },
    { title: stockTake.takeNumber, link: `/stock-takes/${stockTake.id}` },
    { title: "Edit", link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav items={breadcrumbItems} />
      <StockTakeForm stockTakeId={stockTake.id} initialValues={initial} />
    </div>
  );
}

function toFormValues(stockTake: StockTake): Partial<CreateStockTakeInput> {
  const type = stockTake.cycleCountType ?? "FULL";
  const base: Partial<CreateStockTakeInput> = {
    locationType: stockTake.locationType,
    cycleCountType: type,
    blindCount: stockTake.blindCount ?? false,
    notes: stockTake.notes ?? "",
  };

  if (!stockTake.filterCriteria) return base;

  let parsed: Record<string, unknown> = {};
  try {
    const raw = JSON.parse(stockTake.filterCriteria);
    if (raw && typeof raw === "object") parsed = raw as Record<string, unknown>;
  } catch {
    return base;
  }

  switch (type) {
    case "ABC_CLASS":
      return {
        ...base,
        abcClass: typeof parsed.classification === "string"
          ? (String(parsed.classification).toUpperCase() as "A" | "B" | "C")
          : undefined,
      };
    case "ZONE":
      return {
        ...base,
        zoneId: typeof parsed.zoneId === "string" ? parsed.zoneId : undefined,
      };
    case "RANDOM":
      if (typeof parsed.sampleSize === "number") {
        return { ...base, sampleMode: "size", sampleSize: parsed.sampleSize };
      }
      if (typeof parsed.samplePercentage === "number") {
        return {
          ...base,
          sampleMode: "percentage",
          samplePercentage: parsed.samplePercentage,
        };
      }
      return { ...base, sampleMode: "size" };
    default:
      return base;
  }
}
