"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, User } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminAccountListItem, OnboardingState } from "@/types/admin/account";
import { AccountRowActions } from "@/components/tables/admin-accounts/cell-action";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function timeSince(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const then = new Date(value).getTime();
    const diff = Date.now() - then;
    if (diff < 0) return "";
    const days = Math.floor(diff / 86_400_000);
    if (days >= 365) return `${Math.floor(days / 365)}y ago`;
    if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
    if (days >= 1) return `${days}d ago`;
    const hours = Math.floor(diff / 3_600_000);
    if (hours >= 1) return `${hours}h ago`;
    const minutes = Math.floor(diff / 60_000);
    return minutes >= 1 ? `${minutes}m ago` : "just now";
  } catch {
    return "";
  }
}

const STATE_LABEL: Record<OnboardingState, string> = {
  EMAIL_UNVERIFIED: "Email unverified",
  BUSINESS_INCOMPLETE: "Business pending",
  LOCATION_INCOMPLETE: "Location pending",
  COMPLETE: "Fully registered",
};

const STATE_TONE: Record<OnboardingState, string> = {
  EMAIL_UNVERIFIED:
    "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  BUSINESS_INCOMPLETE:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  LOCATION_INCOMPLETE:
    "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400",
  COMPLETE:
    "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
};

interface ColumnDeps {
  canSuspend: boolean;
  canDelete: boolean;
}

export function buildAccountColumns({
  canSuspend,
  canDelete,
}: ColumnDeps): ColumnDef<AdminAccountListItem>[] {
  return [
    {
      accessorKey: "fullName",
      enableHiding: false,
      header: ({ column }) => (
        <Button
          className="text-left p-0 font-semibold"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Account
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const account = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/accounts/${account.id}`}
                className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary block truncate"
              >
                {account.fullName || account.email}
              </Link>
              <span className="text-xs text-muted-foreground font-mono block truncate">
                {account.email}
                {account.accountNumber ? ` · ${account.accountNumber}` : ""}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "whitelabelAppCode",
      header: "Whitelabel",
      enableHiding: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.whitelabelAppCode ?? "—"}
        </span>
      ),
    },
    {
      id: "onboardingState",
      header: "Onboarding",
      enableHiding: true,
      cell: ({ row }) => {
        const state = row.original.onboardingState;
        if (!state) {
          return (
            <span className="text-xs text-muted-foreground">—</span>
          );
        }
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATE_TONE[state]}`}
          >
            {STATE_LABEL[state]}
          </span>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      enableHiding: true,
      cell: ({ row }) => {
        const active = row.original.active;
        const tone = active
          ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
          >
            {active ? "Active" : "Suspended"}
          </span>
        );
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      enableHiding: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.phoneNumber || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          className="text-left p-0 font-semibold"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Registered
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableHiding: true,
      cell: ({ row }) => {
        const created = row.original.createdAt;
        return (
          <div className="flex flex-col">
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {formatDate(created)}
            </span>
            <span className="text-[10.5px] text-muted-foreground">
              {timeSince(created)}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end" data-no-row-click>
          <AccountRowActions
            account={row.original}
            canSuspend={canSuspend}
            canDelete={canDelete}
          />
        </div>
      ),
    },
  ];
}
