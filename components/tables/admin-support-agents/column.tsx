"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { SupportAgentRowActions } from "@/components/tables/admin-support-agents/cell-action";
import { formatDate } from "@/components/admin/shared/format";
import { SupportAgentResponse } from "@/types/admin/support-agent";

export function buildSupportAgentColumns({
  canManage,
}: {
  canManage: boolean;
}): ColumnDef<SupportAgentResponse>[] {
  return [
    {
      accessorKey: "fullName",
      enableHiding: false,
      header: "Agent",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink">{row.original.fullName}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "referralCode",
      header: "Referral code",
      cell: ({ row }) => (
        <span className="font-mono text-[12px]">
          {row.original.referralCode ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "activeReferrals",
      header: () => <span className="block text-right">Active referrals</span>,
      cell: ({ row }) => (
        <div className="text-right font-mono text-[12px] tabular-nums">
          {row.original.activeReferrals.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "totalReferrals",
      header: () => <span className="block text-right">Total referrals</span>,
      cell: ({ row }) => (
        <div className="text-right font-mono text-[12px] tabular-nums">
          {row.original.totalReferrals.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.active
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
              : "border-muted bg-muted text-muted-foreground"
          }
        >
          {row.original.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) =>
        canManage ? (
          <div className="flex justify-end" data-no-row-click>
            <SupportAgentRowActions agent={row.original} />
          </div>
        ) : (
          <span className="block text-right text-xs text-muted-foreground">
            —
          </span>
        ),
    },
  ];
}
