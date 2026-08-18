import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell, PageHeader, PageBreadcrumbs, PageBody } from "@/components/layouts/page-shell";
import {
  fetchBatchById,
  fetchBatchMovements,
  findBatchesByNumber,
} from "@/lib/actions/traceability-actions";
import { BatchDetailPanel } from "@/components/widgets/traceability/batch-detail-panel";
import { BatchPickerList } from "@/components/widgets/traceability/batch-picker-list";
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
      <BatchShell breadcrumbKey={decoded} showNumberAsTitle>
        <BatchPickerList
          batchNumber={decoded}
          batches={resolved.batches}
          totalElements={resolved.totalElements}
        />
      </BatchShell>
    );
  }

  // Single batch — load movements and render the detail panel.
  const movementsRes = await fetchBatchMovements(resolved.batch.id, 0, 50);
  const movements =
    movementsRes.responseType === "success" && movementsRes.data
      ? movementsRes.data
      : { items: [], totalElements: 0, returned: 0, truncated: false };

  return (
    <BatchShell breadcrumbKey={resolved.batch.batchNumber} showNumberAsTitle>
      <BatchDetailPanel
        batch={resolved.batch}
        batchId={resolved.batch.id}
        initialMovements={movements}
      />
    </BatchShell>
  );
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
// to avoid colliding with the imported PageShell primitive.)
function BatchShell({
  breadcrumbKey,
  showNumberAsTitle,
  children,
}: {
  breadcrumbKey: string;
  showNumberAsTitle: boolean;
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
        title={
          showNumberAsTitle ? (
            <span className="font-mono">{breadcrumbKey}</span>
          ) : (
            "Stock batch"
          )
        }
        actions={
          <Link
            href="/traceability"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← back to traceability
          </Link>
        }
      />
      <PageBody>{children}</PageBody>
    </PageShell>
  );
}
