"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AUDIT_ACTION_LABELS,
  type AuditLogEntry,
} from "@/types/audit-log/type";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date),
    time: new Intl.DateTimeFormat("en", {
      timeStyle: "short",
      hour12: false,
    }).format(date),
  };
};

const ACTION_PILL: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  UPDATE: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  DELETE: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  SOFT_DELETE: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  ARCHIVE: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
  UNARCHIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  CANCEL: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
};

export const auditColumns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) => {
      const parts = formatDateTime(row.original.createdAt);
      if (!parts) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span>{parts.date}</span>
          <span className="text-[11px] text-muted-foreground">
            {parts.time}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.original.action;
      const label = AUDIT_ACTION_LABELS[action] ?? action;
      return (
        <Badge
          variant="outline"
          className={cn("font-normal", ACTION_PILL[action] ?? "")}
        >
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-col">
          <span className="text-[12.5px] font-medium">{item.entityType}</span>
          <span
            className="truncate font-mono text-[10.5px] text-muted-foreground"
            title={item.entityId}
          >
            {item.entityId.slice(0, 8)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "staffName",
    header: "Who",
    cell: ({ row }) => {
      const name = row.original.staffName;
      if (!name) return <span className="text-muted-foreground">—</span>;
      return <span className="text-[12.5px]">{name}</span>;
    },
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => {
      const details = row.original.details;
      if (!details) return <span className="text-muted-foreground">—</span>;
      return (
        <span
          className="line-clamp-2 max-w-[420px] text-[12.5px] text-muted-foreground"
          title={details}
        >
          {details}
        </span>
      );
    },
  },
];
