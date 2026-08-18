import Link from "next/link";
import { Activity as ActivityIcon } from "lucide-react";
import {
  EmptyState,
  PanelCard,
  StatusTag,
  type Tone,
} from "@/components/layouts/order-detail";
import type { ApiResponse } from "@/types/types";
import type { StaffAuditEvent } from "@/types/staff";

const ACTION_LABEL: Record<string, string> = {
  STAFF_CREATED: "Created",
  STAFF_UPDATED: "Profile updated",
  DASHBOARD_ACCESS_ENABLED: "Dashboard access granted",
  DASHBOARD_ACCESS_DISABLED: "Dashboard access revoked",
  POS_ACCESS_ENABLED: "POS access granted",
  POS_ACCESS_DISABLED: "POS access revoked",
  DEACTIVATED: "Deactivated",
  REACTIVATED: "Reactivated",
  ROLES_ASSIGNED: "Roles changed",
  PIN_SET: "PIN set",
  PIN_CLEARED: "PIN cleared",
  DASHBOARD_INVITE_RESENT: "Invite re-sent",
  EMAIL_CHANGED: "Login email changed",
  PASSWORD_RESET_FORCED: "Password reset forced",
};

// Grants read positive, revocations read negative — the audit log is mostly
// scanned for "when did this person lose access", so the tone carries it.
const ACTION_TONE: Record<string, Tone> = {
  STAFF_CREATED: "info",
  DASHBOARD_ACCESS_ENABLED: "pos",
  POS_ACCESS_ENABLED: "pos",
  REACTIVATED: "pos",
  PIN_SET: "pos",
  DASHBOARD_ACCESS_DISABLED: "neg",
  POS_ACCESS_DISABLED: "neg",
  DEACTIVATED: "neg",
  PIN_CLEARED: "warn",
  PASSWORD_RESET_FORCED: "warn",
  EMAIL_CHANGED: "warn",
};

// Explicit date + time parts joined by hand — `dateStyle` + `timeStyle`
// together insert a locale connector whose wording differs between the Node
// (SSR) and browser ICU builds, which trips React hydration.
const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${DATE_FMT.format(d)}, ${TIME_FMT.format(d)}`;
}

function summarize(e: StaffAuditEvent): string {
  const d = e.details ?? {};
  if (e.action === "STAFF_UPDATED" && Array.isArray(d.changedFields)) {
    return (d.changedFields as string[]).join(", ") || "—";
  }
  if (e.action === "ROLES_ASSIGNED") {
    const added = (d.added as string[] | undefined)?.length ?? 0;
    const removed = (d.removed as string[] | undefined)?.length ?? 0;
    return `+${added} / -${removed} roles`;
  }
  if (e.action === "DASHBOARD_ACCESS_ENABLED" && typeof d.email === "string") {
    return d.email;
  }
  if (e.action === "PIN_SET" && typeof d.via === "string") {
    return `via ${d.via}`;
  }
  if (e.action === "EMAIL_CHANGED" && typeof d.to === "string") {
    return typeof d.from === "string" && d.from ? `${d.from} → ${d.to}` : d.to;
  }
  if (e.action === "PASSWORD_RESET_FORCED" && typeof d.reason === "string") {
    return d.reason;
  }
  return "—";
}

export function StaffAuditTab({
  staffId,
  data,
  page,
}: {
  staffId: string;
  data: ApiResponse<StaffAuditEvent>;
  page: number;
}) {
  const events = data.content ?? [];

  if (events.length === 0) {
    return (
      <PanelCard icon={<ActivityIcon className="h-3.5 w-3.5" />} title="Activity">
        <EmptyState
          icon={<ActivityIcon className="h-5 w-5" />}
          title="Nothing recorded yet"
          sub="Lifecycle and access changes for this staff member will appear here."
        />
      </PanelCard>
    );
  }

  const totalPages = data.totalPages ?? 1;

  return (
    <PanelCard
      icon={<ActivityIcon className="h-3.5 w-3.5" />}
      title="Activity"
      count={data.totalElements ?? events.length}
      pad0
    >
      {/* Newest-first rail, mirroring the order detail timeline: the dot
          carries the tone, the line carries the sequence. */}
      <div className="max-h-[640px] overflow-auto px-5 pb-5 pt-1">
        {events.map((e, i) => {
          const tone = ACTION_TONE[e.action] ?? "muted";
          const last = i === events.length - 1;
          const detailText = summarize(e);
          return (
            <div
              key={e.id}
              className="grid grid-cols-[auto_1fr] gap-3.5 pb-5 last:pb-0"
            >
              <div className="flex flex-col items-center">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-card ${
                    tone === "pos"
                      ? "bg-pos"
                      : tone === "neg"
                        ? "bg-neg"
                        : tone === "warn"
                          ? "bg-warn"
                          : "bg-line-2"
                  }`}
                />
                {!last && <span className="mt-1 w-0.5 flex-1 bg-line-2" />}
              </div>
              <div className="pb-0.5">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <StatusTag tone={tone}>
                    {ACTION_LABEL[e.action] ?? e.action}
                  </StatusTag>
                  <time className="font-mono text-[10.5px] text-muted-foreground">
                    {formatDateTime(e.createdAt)}
                  </time>
                </div>
                {detailText !== "—" && (
                  <div className="mt-1 break-words text-[12.5px] text-ink-3">
                    {detailText}
                  </div>
                )}
                <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                  by {e.actorName ?? "System"}
                  {e.impersonated && " (impersonated)"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 font-mono text-[11.5px] text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-3">
            {page > 1 && (
              <Link
                className="font-semibold text-ink-2 underline-offset-2 hover:underline"
                href={`/staff/${staffId}?tab=audit&auditPage=${page - 1}`}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                className="font-semibold text-ink-2 underline-offset-2 hover:underline"
                href={`/staff/${staffId}?tab=audit&auditPage=${page + 1}`}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </PanelCard>
  );
}
