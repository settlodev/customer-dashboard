import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
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

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Takes", href: "/stock-takes" },
          { title: stockTake.takeNumber, href: `/stock-takes/${stockTake.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${stockTake.takeNumber}`}
        subtitle="Update count scope and notes before starting."
      />
      <PageBody>
        <StockTakeForm stockTakeId={stockTake.id} initialValues={initial} />
      </PageBody>
    </PageShell>
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
    case "DEPARTMENT":
      return {
        ...base,
        departmentId:
          typeof parsed.departmentId === "string"
            ? parsed.departmentId
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
