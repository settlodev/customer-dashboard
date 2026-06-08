"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { AdminAccountListItem } from "@/types/admin/account";
import { AccountRowActions } from "@/components/tables/admin-accounts/cell-action";
import { Monogram } from "@/components/admin/shared/monogram";
import { OnboardingBadge } from "@/components/admin/shared/onboarding-badge";
import { formatDate, timeSince } from "@/components/admin/shared/format";

interface ColumnDeps {
  canSuspend: boolean;
  canDelete: boolean;
}

function SortHeader({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction?: false | "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-ink"
    >
      {label}
      {direction === "asc" ? (
        <ArrowUp className="h-3 w-3 text-ink-3" />
      ) : direction === "desc" ? (
        <ArrowDown className="h-3 w-3 text-ink-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 text-muted-2" />
      )}
    </button>
  );
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
        <SortHeader
          label="Account"
          direction={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const account = row.original;
        const name = account.fullName || account.email;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Monogram name={name} seed={account.id} size="lg" />
            <div className="min-w-0">
              <Link
                href={`/accounts/${account.id}`}
                className="block truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink hover:text-[#C25E26]"
              >
                {name}
              </Link>
              <span className="block truncate font-mono text-[11.5px] text-muted-foreground">
                {account.email}
                {account.accountNumber && (
                  <span className="text-muted-2"> · {account.accountNumber}</span>
                )}
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
      cell: ({ row }) =>
        row.original.whitelabelAppCode ? (
          <span className="inline-flex rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.04em] text-ink-3">
            {row.original.whitelabelAppCode}
          </span>
        ) : (
          <span className="text-[12.5px] text-muted-2">—</span>
        ),
    },
    {
      id: "onboardingState",
      header: "Onboarding",
      enableHiding: true,
      cell: ({ row }) => <OnboardingBadge state={row.original.onboardingState} />,
    },
    {
      accessorKey: "active",
      header: "Status",
      enableHiding: true,
      cell: ({ row }) => {
        const active = row.original.active;
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
            <span
              className={cn(
                "h-[7px] w-[7px] rounded-full",
                active ? "bg-pos" : "bg-muted-2",
              )}
            />
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
        <span className="font-mono text-[12.5px] text-ink-2">
          {row.original.phoneNumber || "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      enableHiding: true,
      header: ({ column }) => (
        <SortHeader
          label="Registered"
          direction={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const created = row.original.createdAt;
        return (
          <div className="flex flex-col">
            <span className="text-[13px] text-ink">{formatDate(created)}</span>
            <span className="font-mono text-[11.5px] text-muted-foreground">
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
