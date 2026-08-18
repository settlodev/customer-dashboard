"use client";

import { useEffect, useState, useTransition } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import { getAdminDevice } from "@/lib/actions/admin/devices";
import { getAdminStaff } from "@/lib/actions/admin/staff";
import { getDeadLetterContext } from "@/lib/actions/admin/stuck-writes";
import type { AdminDeviceSummary } from "@/types/admin/device";
import type { AdminStaffSummary } from "@/types/admin/staff";
import type {
  DeadLetterContextResponse,
  DeadLetterRow,
} from "@/types/admin/stuck-writes";

// ── helpers ────────────────────────────────────────────────────────────────

function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function prettyJson(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

// ── sub-components ─────────────────────────────────────────────────────────

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-0.5 py-1">
      <dt className="text-[12px] font-medium text-muted-foreground">{label}</dt>
      <dd
        className={
          mono
            ? "break-all font-mono text-[12px] text-ink"
            : "text-[12.5px] text-ink"
        }
      >
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

function BoolChip({ value }: { value: boolean }) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-amber-700"
          : "inline-flex rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground"
      }
    >
      {value ? "yes" : "no"}
    </span>
  );
}

// ── actor details (device + staff, fetched together on open) ───────────────

function useActorDetails(
  deviceId: string,
  staffId: string | null,
  open: boolean,
) {
  const [device, setDevice] = useState<AdminDeviceSummary | null>(null);
  const [staff, setStaff] = useState<AdminStaffSummary | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDevice(null);
    setStaff(null);
    startTransition(async () => {
      const [deviceResult, staffResult] = await Promise.all([
        getAdminDevice(deviceId),
        staffId ? getAdminStaff(staffId) : Promise.resolve(null),
      ]);
      setDevice(deviceResult);
      setStaff(staffResult);
    });
  }, [deviceId, staffId, open]);

  const deviceDisplayName = device?.customName ?? device?.name ?? null;

  // While loading or on failure, staffResult stays null → falls back to shortId.
  const staffDisplayName = staffId
    ? (staff?.fullName ??
        (`${staff?.firstName ?? ""} ${staff?.lastName ?? ""}`.trim() || null) ??
        shortId(staffId))
    : null;

  return {
    deviceDisplayName,
    lastActiveAt: device?.lastActiveAt ?? null,
    appVersion: device?.appVersion ?? null,
    staffDisplayName,
  };
}

// ── diagnostic context (merged server + device timeline, fetched on open) ────

function useDeadLetterContext(id: string, open: boolean) {
  const [ctx, setCtx] = useState<DeadLetterContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setCtx(null);
      return;
    }
    setLoading(true);
    startTransition(async () => {
      const data = await getDeadLetterContext(id);
      setCtx(data);
      setLoading(false);
    });
  }, [id, open]);

  return { ctx, loading };
}

// ── main component ─────────────────────────────────────────────────────────

interface DeadLetterDetailsDialogProps {
  row: DeadLetterRow;
}

export function DeadLetterDetailsDialog({ row }: DeadLetterDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const { deviceDisplayName, lastActiveAt, appVersion, staffDisplayName } =
    useActorDetails(row.deviceId, row.staffId, open);
  const { ctx: context, loading: contextLoading } = useDeadLetterContext(
    row.id,
    open,
  );

  const deviceLabel = deviceDisplayName
    ? `${deviceDisplayName} (${shortId(row.deviceId)})`
    : shortId(row.deviceId);

  const payloadText = prettyJson(row.payload);

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
        title="View full details"
      >
        <FileText className="h-3.5 w-3.5" />
        Details
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
          <DialogHeader className="flex-none">
            <DialogTitle className="flex items-center gap-2">
              Dead-letter details
              {row.isMoneyOp && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-700">
                  money op
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="font-mono text-[12px]">
              {row.idempotencyKey ?? row.id}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {/* Core identifiers */}
            <section className="mb-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Mutation
              </p>
              <dl>
                <Field label="Op type" value={row.opType} mono />
                <Field label="Classification" value={row.classification} mono />
                <Field label="Attempts" value={String(row.attempts)} mono />
                <Field label="Money op" value={<BoolChip value={row.isMoneyOp} />} />
                <Field label="Idempotency key" value={row.idempotencyKey} mono />
                <Field label="Resource id" value={row.resourceId} mono />
                {row.orderNumber && (
                  <Field label="Order #" value={row.orderNumber} mono />
                )}
                <Field
                  label="Offline created"
                  value={formatDateTime(row.offlineCreatedAt)}
                />
                <Field
                  label="Dead-lettered"
                  value={formatDateTime(row.deadLetteredAt)}
                />
              </dl>
            </section>

            {/* Actor / tenant */}
            <section className="mb-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Actor / Tenant
              </p>
              <dl>
                <Field
                  label="Device"
                  value={
                    <span title={row.deviceId}>
                      {deviceLabel}
                    </span>
                  }
                />
                <Field label="Device id" value={row.deviceId} mono />
                <Field
                  label="Last seen"
                  value={
                    lastActiveAt
                      ? `${formatDateTime(lastActiveAt)} (${timeSince(lastActiveAt)})`
                      : "—"
                  }
                />
                <Field label="App version" value={appVersion ?? "—"} mono />
                <Field
                  label="Staff"
                  value={
                    row.staffId ? (
                      <span title={row.staffId}>{staffDisplayName}</span>
                    ) : (
                      "System"
                    )
                  }
                />
                <Field label="Staff id" value={row.staffId} mono />
                <Field label="Location id" value={row.locationId} mono />
                <Field label="Business id" value={row.businessId} mono />
              </dl>
            </section>

            {/* Error */}
            {row.lastError && (
              <section className="mb-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Last error
                </p>
                <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-[11.5px] text-destructive">
                  {row.lastError}
                </pre>
              </section>
            )}

            {/* Payload */}
            {payloadText && (
              <section className="mb-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Payload
                </p>
                <pre className="max-h-72 overflow-y-auto whitespace-pre rounded-md border border-line bg-canvas px-3 py-2 font-mono text-[11.5px] text-ink-2">
                  {payloadText}
                </pre>
              </section>
            )}

            {/* What happened — merged server + device timeline */}
            <section className="mb-1 mt-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                What happened
              </p>
              {contextLoading && (
                <p className="text-[12.5px] text-muted-foreground">
                  Loading timeline…
                </p>
              )}
              {!contextLoading && !context && (
                <p className="text-[12.5px] text-muted-foreground">
                  Timeline unavailable.
                </p>
              )}
              {!contextLoading && context && (
                <>
                  {context.orderNumber && (
                    <p className="mb-1.5 text-[12.5px] text-ink-2">
                      Order {context.orderNumber}
                      {context.orderStatus ? ` · ${context.orderStatus}` : ""}
                    </p>
                  )}
                  {!context.orderFound && (
                    <p className="mb-1.5 text-[12.5px] text-muted-foreground">
                      No matching order on the server — it may never have synced.
                    </p>
                  )}
                  {context.timeline.length === 0 ? (
                    <p className="text-[12.5px] text-muted-foreground">
                      No timeline entries.
                    </p>
                  ) : (
                    <ol className="space-y-1.5">
                      {context.timeline.map((e, i) => (
                        <li key={i} className="flex gap-2 text-[12.5px]">
                          <span
                            className={`mt-0.5 inline-block shrink-0 rounded px-1 font-mono text-[10px] font-medium ${
                              e.source === "SERVER"
                                ? "bg-sky-100 text-sky-700"
                                : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            {e.source}
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-muted-foreground">
                            {e.at ? formatDateTime(e.at) : "—"}
                          </span>
                          <span className="text-ink-2">
                            <span className="font-medium text-ink">{e.type}</span>
                            {e.description ? ` — ${e.description}` : ""}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              )}
            </section>
          </div>

          <DialogFooter className="flex-none">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
