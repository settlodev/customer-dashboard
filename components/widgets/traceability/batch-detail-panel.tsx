"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronsLeft,
  ChevronsRight,
  Download,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";
import {
  AffectedOrder,
  BatchMovement,
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
  StockBatchSummary,
} from "@/types/traceability/type";
import { Attachment } from "@/types/attachment/type";
import type {
  StockModification,
  StockModificationItem,
} from "@/types/stock-modification/type";
import {
  fetchAffectedOrders,
  fetchBatchMovements,
} from "@/lib/actions/traceability-actions";
import {
  deleteAttachment,
  getAttachmentDownloadHref,
  listAttachments,
  registerAttachment,
} from "@/lib/actions/attachment-actions";
import { useUpload } from "@/lib/uploads/use-upload";

const PAGE_SIZE = 50;

/** One value-correction line against this batch, with its parent document. */
export interface BatchCorrectionLine {
  correction: StockModification;
  item: StockModificationItem;
}

interface Props {
  batch: StockBatchSummary;
  batchId: string;
  initialMovements: {
    items: BatchMovement[];
    totalElements: number;
    returned: number;
    truncated: boolean;
  };
  /** Server-fetched so a correction saved from the page header shows up on
   *  the router refresh the modal triggers (see the batch page). */
  corrections: BatchCorrectionLine[];
}

export function BatchDetailPanel({
  batch,
  batchId,
  initialMovements,
  corrections,
}: Props) {
  const [movements, setMovements] = useState<BatchMovement[]>(
    initialMovements.items,
  );
  const [totalMovements, setTotalMovements] = useState(
    initialMovements.totalElements,
  );
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const totalPages = Math.max(1, Math.ceil(totalMovements / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const loadPage = (nextPage: number) => {
    startTransition(async () => {
      const res = await fetchBatchMovements(batchId, nextPage, PAGE_SIZE);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't load movements",
          description: res.message,
        });
        return;
      }
      setMovements(res.data?.items ?? []);
      setTotalMovements(res.data?.totalElements ?? 0);
      setPage(nextPage);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field
              label="Status"
              value={
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BATCH_STATUS_TONES[batch.status]}`}
                >
                  {BATCH_STATUS_LABELS[batch.status]}
                </span>
              }
            />
            <Field label="Variant" value={batch.stockVariantDisplayName ?? "—"} />
            <Field
              label="On hand"
              value={Number(batch.quantityOnHand ?? 0).toLocaleString()}
            />

            <Field
              label="Initial quantity"
              value={Number(batch.initialQuantity ?? 0).toLocaleString()}
            />
            <Field
              label="Unit cost"
              value={
                batch.unitCost != null ? (
                  <Money
                    amount={Number(batch.unitCost)}
                    currency={batch.currency || DEFAULT_CURRENCY}
                  />
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Received"
              value={
                batch.receivedDate
                  ? new Date(batch.receivedDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <Field
              label="Expiry"
              value={
                batch.expiryDate
                  ? new Date(batch.expiryDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
            />
          </div>

          {batch.status === "RECALLED" && batch.recallReason && (
            <div className="mt-6 rounded-md border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 text-sm">
              <p className="font-medium text-red-900 dark:text-red-300">Recalled</p>
              <p className="mt-1 text-red-800 dark:text-red-400 italic">
                &ldquo;{batch.recallReason}&rdquo;
              </p>
              {batch.recalledAt && (
                <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                  {new Date(batch.recalledAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          )}

          {batch.recallRevertedAt && (
            <div className="mt-3 rounded-md border border-amber-100 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-300">
                Recall reverted on{" "}
                {new Date(batch.recallRevertedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {batch.recallRevertReason && (
                <p className="mt-1 text-amber-800 dark:text-amber-400 italic">
                  &ldquo;{batch.recallRevertReason}&rdquo;
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {batch.status === "RECALLED" && (
        <AffectedOrdersSection batchId={batchId} />
      )}

      <AttachmentsSection batchId={batchId} />

      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Movements</h3>
            <span className="text-xs text-muted-foreground">
              {totalMovements.toLocaleString()} total
            </span>
          </div>

          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No movements recorded against this batch yet.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/60">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        When
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Type
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                        Quantity
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                        Unit cost
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(m.occurredAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${movementTone(m)}`}
                          >
                            {m.movementType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {Number(m.quantity).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 4,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {m.unitCost != null ? (
                            <Money
                              amount={Number(m.unitCost)}
                              currency={m.currency || DEFAULT_CURRENCY}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                          {m.referenceType && m.referenceId ? (
                            <span>
                              {m.referenceType} · {m.referenceId.slice(0, 8)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs border-t">
                  <span className="text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => canPrev && loadPage(page - 1)}
                      disabled={!canPrev || isPending}
                    >
                      {isPending && !canNext ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <ChevronsLeft className="h-4 w-4 mr-1" />
                      )}
                      Prev
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => canNext && loadPage(page + 1)}
                      disabled={!canNext || isPending}
                    >
                      Next
                      {isPending && canNext ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-1" />
                      ) : (
                        <ChevronsRight className="h-4 w-4 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CorrectionsSection lines={corrections} />
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function AffectedOrdersSection({ batchId }: { batchId: string }) {
  const [orders, setOrders] = useState<AffectedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowDays, setWindowDays] = useState<number | null>(90);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetchAffectedOrders(batchId, windowDays)
      .then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't load affected orders",
            description: res.message,
          });
          setOrders([]);
          return;
        }
        setOrders(res.data ?? []);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, windowDays]);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-medium">Affected orders</h3>
            <p className="text-xs text-muted-foreground">
              Sales that drew from this recalled batch. Use this list to
              reach out to affected customers.
            </p>
          </div>
          <div className="flex gap-1 text-xs">
            {([30, 90, 180, null] as Array<number | null>).map((d) => (
              <button
                key={String(d)}
                onClick={() => setWindowDays(d)}
                className={`px-2 py-1 rounded border ${
                  windowDays === d
                    ? "bg-ink text-canvas border-ink"
                    : "hover:bg-muted"
                }`}
              >
                {d === null ? "All time" : `Last ${d}d`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No sales drew from this batch in the selected window.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Order
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                    Units
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                    First hit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                      {o.orderId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {Number(o.totalQuantity).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {o.firstOccurredAt
                        ? new Date(o.firstOccurredAt).toLocaleString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground pt-2">
              {orders.length} distinct order(s).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * This batch's value-correction history. The lines are fetched by the page
 * (see `loadCorrections` there); each row links to the stock modification it
 * belongs to, so a correction opened from here and one opened from the
 * stock-modifications list land on the same screen.
 */
function CorrectionsSection({ lines }: { lines: BatchCorrectionLine[] }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Value corrections</h3>
          {lines.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {lines.length.toLocaleString()} total
            </span>
          )}
        </div>

        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No value corrections recorded against this batch yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Reference
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                    When
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                    Cost change
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                    On hand
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                    Already used
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Reason
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                    By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lines.map(({ correction, item }, idx) => (
                  <tr key={`${correction.id}-${idx}`} className="align-top">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/stock-modifications/${correction.id}`}
                        className="font-mono text-xs font-semibold text-ink hover:underline"
                      >
                        {correction.modificationNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(correction.modificationDate).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.previousUnitCost != null && item.unitCost != null ? (
                        <span className="flex flex-col items-end">
                          <span className="text-muted-foreground line-through text-xs">
                            <Money
                              amount={item.previousUnitCost}
                              currency={correction.currency || DEFAULT_CURRENCY}
                            />
                          </span>
                          <span>
                            <Money
                              amount={item.unitCost}
                              currency={correction.currency || DEFAULT_CURRENCY}
                            />
                          </span>
                        </span>
                      ) : (
                        <Money
                          amount={item.unitCost ?? 0}
                          currency={correction.currency || DEFAULT_CURRENCY}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Money
                        amount={item.valueDeltaOnHand ?? 0}
                        currency={correction.currency || DEFAULT_CURRENCY}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Money
                        amount={item.valueDeltaConsumed ?? 0}
                        currency={correction.currency || DEFAULT_CURRENCY}
                      />
                    </td>
                    <td className="px-3 py-2 text-ink-2">{correction.reason}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {correction.performedByName || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttachmentsSection({ batchId }: { batchId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, startUpload] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress } = useUpload();
  const busy = isUploading || isRegistering;

  const refresh = () => {
    setLoading(true);
    listAttachments("BATCH_RECALL", batchId)
      .then((list) => setAttachments(list))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await upload({ file, purpose: "INVENTORY_ATTACHMENT" });
      startUpload(async () => {
        const res = await registerAttachment("BATCH_RECALL", batchId, {
          url: result.url,
          key: result.key,
          filename: result.filename,
          contentType: result.contentType,
          size: result.size,
        });
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: res.message,
          });
        } else {
          toast({ title: "Uploaded", description: res.message });
          refresh();
        }
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = async (attachment: Attachment) => {
    const confirmed = window.confirm(
      `Remove ${attachment.originalFileName ?? attachment.fileName}?`,
    );
    if (!confirmed) return;
    const res = await deleteAttachment(attachment.id, "BATCH_RECALL");
    if (res.responseType === "error") {
      toast({
        variant: "destructive",
        title: "Couldn't remove",
        description: res.message,
      });
      return;
    }
    refresh();
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Documents
            </h3>
            <p className="text-xs text-muted-foreground">
              Recall notices, QA reports, photos of damaged stock. 10 MB max
              per file.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isUploading && progress ? `${progress.percent}%` : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileSelected}
          />
        </div>

        {loading ? (
          <Skeleton className="h-8 w-full" />
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No documents attached.
          </p>
        ) : (
          <ul className="divide-y border rounded-md">
            {attachments.map((a) => (
              <AttachmentRow
                key={a.id}
                attachment={a}
                onRemove={removeAttachment}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AttachmentRow({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: (a: Attachment) => void;
}) {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    getAttachmentDownloadHref(attachment).then(setHref);
  }, [attachment]);

  return (
    <li className="flex items-center justify-between px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">
          {attachment.originalFileName ?? attachment.fileName}
        </div>
        <div className="text-xs text-muted-foreground">
          {attachment.contentType ?? "—"}
          {attachment.fileSize
            ? ` · ${(attachment.fileSize / 1024).toFixed(1)} KB`
            : ""}
          {" · "}
          {new Date(attachment.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
      <div className="flex gap-1 pl-3">
        {href && (
          <Button asChild variant="ghost" size="sm">
            <a href={href} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(attachment)}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function movementTone(m: BatchMovement): string {
  switch (m.movementType) {
    case "PURCHASE":
    case "TRANSFER_IN":
    case "OPENING_BALANCE":
    case "PRODUCTION_OUTPUT":
      return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400";
    case "SALE":
    case "TRANSFER_OUT":
    case "RECIPE_USAGE":
    case "PRODUCTION_ISSUE":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
    case "DAMAGE":
    case "WASTE":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
    case "RECALL":
      return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400";
    default:
      return "bg-muted text-ink-2";
  }
}
