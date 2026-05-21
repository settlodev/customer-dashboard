"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountActionDialog } from "@/components/admin/account-action-dialog";
import { AdminAccountListItem } from "@/types/admin/account";

type ActionKind = "suspend" | "reactivate" | "delete";

interface AccountRowActionsProps {
  account: AdminAccountListItem;
  canSuspend: boolean;
  canDelete: boolean;
}

export function AccountRowActions({
  account,
  canSuspend,
  canDelete,
}: AccountRowActionsProps) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Actions for ${account.fullName || account.email}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/accounts/${account.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>
          {canSuspend && (
            <>
              <DropdownMenuSeparator />
              {account.active ? (
                <DropdownMenuItem
                  onSelect={() => setActiveAction("suspend")}
                  className="text-amber-700 focus:bg-amber-50 focus:text-amber-800 dark:text-amber-300 dark:focus:bg-amber-500/10"
                >
                  Suspend
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => setActiveAction("reactivate")}
                  className="text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-300 dark:focus:bg-emerald-500/10"
                >
                  Reactivate
                </DropdownMenuItem>
              )}
            </>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setActiveAction("delete")}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeAction && (
        <AccountActionDialog
          kind={activeAction}
          account={account}
          open={!!activeAction}
          onOpenChange={(open) => {
            if (!open) setActiveAction(null);
          }}
          onDone={() => {
            setActiveAction(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
