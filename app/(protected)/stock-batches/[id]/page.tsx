import { notFound } from "next/navigation";
import { PageShell, PageHeader, PageBreadcrumbs, PageBody } from "@/components/layouts/page-shell";
import {
  fetchBatchById,
  fetchBatchMovements,
  findBatchesByNumber,
} from "@/lib/actions/traceability-actions";
import { searchStockModifications } from "@/lib/actions/stock-modification-actions";
import {
  BatchDetailPanel,
  type BatchCorrectionLine,
} from "@/components/widgets/traceability/batch-detail-panel";
import { BatchPickerList } from "@/components/widgets/traceability/batch-picker-list";
import { CorrectValueAction } from "@/components/widgets/inventory/correct-value-action";
import type { StockBatchSummary } from "@/types/traceability/type";

interface Props {
  params: Promise<{ id: string }>;
}

// Matches the canonical UUID form Spring returns. Anything that doesn't parse
// as a UUID is treated as a batch number — users typically have the number
// ("BTH_…") in hand from a paper / email / phone call, not the id.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StockBatchDetailPage({ params }: Props) {
  const { id } = await params;
  const decoded = decodeURIComponent(id).trim();

  const resolved = UUID_RE.test(decoded)
    ? await resolveById(decoded)
    : await resolveByBatchNumber(decoded);

  if (resolved.kind === "not-found") {
    notFound();
  }

  if (resolved.kind === "picker") {
    return (
      <BatchShell breadcrumbKey={decoded}>
        <BatchPickerList
          batchNumber={decoded}
          batches={resolved.batches}
          totalElements={resolved.totalElements}
        />
      </BatchShell>
    );
  }

  // Single batch — load movements and this batch's value-correction history,
  // then render the detail panel.
  const batch = resolved.batch;
  const [movementsRes, corrections] = await Promise.all([
    fetchBatchMovements(batch.id, 0, 50),
    loadCorrections(batch.id),
  ]);
  const movements =
    movementsRes.responseType === "success" && movementsRes.data
      ? movementsRes.data
      : { items: [], totalElements: 0, returned: 0, truncated: false };

  return (
    <BatchShell
      breadcrumbKey={batch.batchNumber}
      actions={
        <CorrectValueAction
          targets={[
            {
              variantId: batch.stockVariantId,
              variantName: batch.stockVariantDisplayName ?? "Unknown item",
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              currentUnitCost: batch.unitCost ?? 0,
              quantityOnHand: batch.quantityOnHand,
              initialQuantity: batch.initialQuantity,
              currency: batch.currency,
            },
          ]}
        />
      }
    >
      <BatchDetailPanel
        batch={batch}
        batchId={batch.id}
        initialMovements={movements}
        corrections={corrections}
      />
    </BatchShell>
  );
}

/**
 * This batch's value-correction history — every CORRECTION-category stock
 * modification whose line items target this batch, whether it originated
 * from this page's own "Correct value" button, the stock-intake detail page,
 * or the modification form's value-only mode. There's no batch-scoped search
 * endpoint, so this fetches CORRECTION modifications (bounded to a generous
 * page) and filters by `batchId`. Fetched here rather than in the panel so a
 * correction saved from the header action shows up on the router refresh
 * the modal already triggers.
 */
async function loadCorrections(batchId: string): Promise<BatchCorrectionLine[]> {
  try {
    const res = await searchStockModifications(0, 100, "CORRECTION");
    return (res?.content ?? []).flatMap((correction) =>
      (correction.items ?? [])
        .filter((item) => item.batchId === batchId)
        .map((item) => ({ correction, item })),
    );
  } catch {
    return [];
  }
}

type Resolved =
  | { kind: "not-found" }
  | { kind: "single"; batch: StockBatchSummary }
  | {
      kind: "picker";
      batches: StockBatchSummary[];
      totalElements: number;
    };

async function resolveById(id: string): Promise<Resolved> {
  const res = await fetchBatchById(id);
  if (res.responseType === "error" || !res.data) {
    return { kind: "not-found" };
  }
  return { kind: "single", batch: res.data };
}

async function resolveByBatchNumber(batchNumber: string): Promise<Resolved> {
  const res = await findBatchesByNumber(batchNumber, 0, 50);
  if (res.responseType === "error" || !res.data) {
    return { kind: "not-found" };
  }
  const items = res.data.items;
  if (items.length === 0) return { kind: "not-found" };
  // Only exact matches collapse to a single-detail view — a partial substring
  // ("BTH") would otherwise silently pick the first of many. Exact-match keeps
  // the semantics honest for URL-typed lookups.
  const exact = items.filter(
    (b) => b.batchNumber.toLowerCase() === batchNumber.toLowerCase(),
  );
  if (exact.length === 1) {
    return { kind: "single", batch: exact[0] };
  }
  return {
    kind: "picker",
    batches: exact.length > 0 ? exact : items,
    totalElements: res.data.totalElements,
  };
}

// Shared chrome for both the single-batch and picker branches. Renders the
// standard PageShell so the page matches the rest of the app. (Named BatchShell
// to avoid colliding with the imported PageShell primitive.) The breadcrumb
// is the way back to Traceability — no separate back link.
function BatchShell({
  breadcrumbKey,
  actions,
  children,
}: {
  breadcrumbKey: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Traceability", href: "/traceability" },
          { title: breadcrumbKey },
        ]}
      />
      <PageHeader
        title={<span className="font-mono">{breadcrumbKey}</span>}
        subtitle="Stock batch"
        actions={actions}
      />
      <PageBody>{children}</PageBody>
    </PageShell>
  );
}
