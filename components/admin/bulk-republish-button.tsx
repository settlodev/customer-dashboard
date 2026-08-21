"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import {
  republishAllAccounts,
  republishAllBusinesses,
  republishAllLocations,
  republishAllStaff,
  republishAllUsers,
} from "@/lib/actions/admin/accounts";
import type { FormResponse } from "@/types/types";

/**
 * One-off maintenance actions that re-emit every entity's events so
 * event-sourced analytics (Reports' dim_* tables and the admin dashboard
 * counts built on them) pick up entities that predate the Kafka consumers or
 * arrived via the legacy-system data migration — those are invisible to
 * analytics until their events are re-emitted, which is why the dashboard
 * undercounts against the Accounts database.
 *
 * Every action re-emits state events only (*_UPDATED, or USER_CREATED plus
 * verification signals actually held): no welcome or verification emails ride
 * these topics, and each is idempotent and safe to repeat. All are gated by
 * internal:accounts:manage, the permission the backend endpoints require.
 */

type Backfill = {
  key: string;
  label: string;
  title: string;
  description: React.ReactNode;
  action: () => Promise<FormResponse<unknown>>;
};

const BACKFILLS: Backfill[] = [
  {
    key: "accounts",
    label: "Accounts",
    title: "Backfill all accounts?",
    description: (
      <>
        Re-emits <strong>ACCOUNT_UPDATED</strong> for every non-deleted account
        so analytics recover each account&apos;s details and created date. Sends
        no emails; safe to repeat.
      </>
    ),
    action: republishAllAccounts,
  },
  {
    key: "businesses",
    label: "Businesses",
    title: "Backfill all businesses?",
    description: (
      <>
        Re-emits <strong>BUSINESS_UPDATED</strong> for every non-deleted
        business so the dashboard&apos;s business counts and merchant lifecycle
        include businesses analytics never saw. Safe to repeat.
      </>
    ),
    action: republishAllBusinesses,
  },
  {
    key: "locations",
    label: "Locations",
    title: "Backfill all locations?",
    description: (
      <>
        Re-emits <strong>LOCATION_UPDATED</strong> for every non-deleted
        location so location counts (including paying locations) include
        locations analytics never saw. Safe to repeat.
      </>
    ),
    action: republishAllLocations,
  },
  {
    key: "staff",
    label: "Staff",
    title: "Backfill all staff?",
    description: (
      <>
        Re-emits <strong>STAFF_UPDATED</strong> for every non-deleted staff
        member so sales reports can label staff that analytics never saw. Safe
        to repeat.
      </>
    ),
    action: republishAllStaff,
  },
  {
    key: "users",
    label: "Auth users",
    title: "Backfill all auth users?",
    description: (
      <>
        Re-emits <strong>USER_CREATED</strong> plus any verification signals
        each user actually holds, so the signup funnel includes users analytics
        never saw. Never fabricates a verification and sends no emails; safe to
        repeat.
      </>
    ),
    action: republishAllUsers,
  },
];

export function BulkRepublishButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Backfill | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!selected) return;
    setError("");
    startTransition(async () => {
      const result = await selected.action();
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({
        title: `${selected.label} backfilled`,
        description: result.message,
      });
      setSelected(null);
      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-500/10"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Backfill analytics
            <ChevronDown className="ml-1.5 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Re-emit events for…</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {BACKFILLS.map((backfill) => (
            <DropdownMenuItem
              key={backfill.key}
              onSelect={() => setSelected(backfill)}
            >
              {backfill.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={selected !== null}
        onOpenChange={(next) => {
          if (isPending) return;
          if (!next) {
            setSelected(null);
            setError("");
          }
        }}
      >
        <AlertDialogContent tone="success">
          <AlertDialogIcon>
            <RefreshCw className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>{selected?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && <FormError message={error} />}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </span>
              ) : (
                `Backfill ${selected?.label.toLowerCase() ?? ""}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
