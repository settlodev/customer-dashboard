import Link from "next/link";
import { Activity as ActivityIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
};

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
      <Card>
        <CardContent className="py-12 text-center">
          <ActivityIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No activity recorded yet. Lifecycle and access changes will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPages = data.totalPages ?? 1;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          Audit log
        </h3>
        <div className="max-h-[600px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="soft" className="text-[10.5px]">
                      {ACTION_LABEL[e.action] ?? e.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {e.actorName ?? "System"}
                    {e.impersonated && (
                      <span className="ml-1 text-muted-foreground">(impersonated)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {summarize(e)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link className="underline" href={`/staff/${staffId}?tab=audit&auditPage=${page - 1}`}>
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link className="underline" href={`/staff/${staffId}?tab=audit&auditPage=${page + 1}`}>
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
