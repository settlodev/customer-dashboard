import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { Boxes, Layers, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTransferRequest } from "@/lib/actions/stock-transfer-request-actions";
import { getCurrentDestination } from "@/lib/actions/context";
import {
  getTransferRequestStatusLabel,
  type TransferRequest,
} from "@/types/stock-transfer-request/type";
import { TransferRequestStatusActions } from "@/components/widgets/stock-transfer-request/status-actions";

type Params = Promise<{ id: string }>;

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default async function StockRequestPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const [item, destination] = await Promise.all([
    getTransferRequest(id),
    getCurrentDestination(),
  ]);

  if (!item) notFound();

  const reviewed = item.status === "APPROVED" || item.status === "DECLINED";
  const totalRequested = (item.items ?? []).reduce(
    (sum, line) => sum + line.requestedQuantity,
    0,
  );
  const totalApproved = (item.items ?? []).reduce(
    (sum, line) => sum + (line.approvedQuantity ?? 0),
    0,
  );

  const meta: { label: string; value: string }[] = [
    { label: "Requester", value: item.requestingLocationName || "—" },
    { label: "Source", value: item.sourceLocationName || "—" },
    { label: "Requested by", value: item.requestedByName || "—" },
    { label: "Requested at", value: formatDate(item.requestedAt) },
    { label: "Reviewed by", value: item.reviewedByName || "—" },
    { label: "Reviewed at", value: formatDate(item.reviewedAt) },
  ];

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Requests", href: "/stock-requests" },
          { title: item.requestNumber },
        ]}
      />
      <PageHeader
        title={item.requestNumber}
        subtitle={`${item.sourceLocationName ?? "Source"} → ${item.requestingLocationName ?? "Requester"} — ${getTransferRequestStatusLabel(item, destination?.id ?? null)}`}
        actions={
          <TransferRequestStatusActions
            request={item}
            activeDestinationId={destination?.id ?? null}
          />
        }
      />
      <PageBody>
        <KpiStrip cols={3}>
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Items"
            value={(item.items?.length ?? 0).toLocaleString()}
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Requested qty"
            value={totalRequested.toLocaleString()}
          />
          <KpiCard
            icon={<CheckCheck className="h-3 w-3" />}
            label="Approved qty"
            value={reviewed ? totalApproved.toLocaleString() : "—"}
          />
        </KpiStrip>

        {item.items && item.items.length > 0 && (
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <h3 className="text-lg font-medium mb-4">Requested Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                        Requested
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                        Approved
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {item.items.map((line) => (
                      <tr key={line.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {line.variantName}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {line.requestedQuantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {line.approvedQuantity != null
                            ? line.approvedQuantity.toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {line.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {meta.map((row) => (
                <div key={row.label}>
                  <dt className="text-xs font-medium text-gray-400 uppercase">
                    {row.label}
                  </dt>
                  <dd className="text-sm mt-1">{row.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <RequestNotes item={item} />
      </PageBody>
    </PageShell>
  );
}

function RequestNotes({ item }: { item: TransferRequest }) {
  const blocks: { label: string; value: string }[] = [];
  if (item.notes) blocks.push({ label: "Request notes", value: item.notes });
  if (item.reviewNotes)
    blocks.push({ label: "Review notes", value: item.reviewNotes });
  if (item.declineReason)
    blocks.push({ label: "Decline reason", value: item.declineReason });

  if (blocks.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-4 pb-3 space-y-3">
        {blocks.map((block) => (
          <div key={block.label}>
            <p className="text-xs font-medium text-gray-400 uppercase">
              {block.label}
            </p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{block.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
