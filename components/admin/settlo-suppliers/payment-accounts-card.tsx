"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SectionCard } from "@/components/admin/shared/section-card";
import { useToast } from "@/hooks/use-toast";
import {
  deleteSupplierPaymentAccount,
  setDefaultSupplierPaymentAccount,
  verifySupplierPaymentAccount,
} from "@/lib/actions/admin/settlo-suppliers";
import {
  PAYMENT_METHOD_LABELS,
  PaymentAccountDialog,
  providerLabel,
} from "@/components/admin/settlo-suppliers/payment-account-dialog";
import type {
  AdminSettloSupplier,
  SupplierPaymentAccount,
} from "@/types/admin/settlo-suppliers";
import type { FormResponse } from "@/types/types";

interface PaymentAccountsCardProps {
  supplier: AdminSettloSupplier;
  canManage: boolean;
}

/**
 * PaymentAccountsCard — lists a supplier's disbursement rails and lets
 * ops manage them: add, edit (re-triggers verification per the backend's
 * un-verify-on-payee-change rule), verify, promote to default, and
 * delete. Every mutation surfaces the backend's `FormResponse.message`
 * verbatim on failure (409s for "can't change method on the default
 * account" / "can't delete the default account", 400 for "must be
 * verified + disbursement-ready before becoming default").
 */
export function PaymentAccountsCard({
  supplier,
  canManage,
}: PaymentAccountsCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<SupplierPaymentAccount | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SupplierPaymentAccount | null>(null);

  const accounts = supplier.paymentAccounts;

  const runAction = (
    accountId: string,
    fn: (id: string) => Promise<FormResponse<SupplierPaymentAccount>>,
    failureTitle: string,
  ) => {
    setPendingId(accountId);
    startTransition(async () => {
      const result = await fn(accountId);
      setPendingId(null);
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: failureTitle,
          description: result.message,
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteSupplierPaymentAccount(id);
      setPendingId(null);
      if (result.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't delete account",
          description: result.message,
        });
        setDeleteTarget(null);
        return;
      }
      toast({ title: result.message });
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const openAdd = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const openEdit = (account: SupplierPaymentAccount) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  return (
    <>
      <SectionCard
        title="Payment accounts"
        subtitle="Disbursement rails on file for this supplier."
        action={
          canManage ? (
            <Button type="button" variant="outline" size="sm" onClick={openAdd}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add account
            </Button>
          ) : undefined
        }
      >
        {accounts.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            No payment accounts on file.
          </p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <ul className="divide-y divide-line">
              {accounts.map((account) => {
                const identifier =
                  account.accountNumber ?? account.mobileNumber ?? "—";
                const methodLabel = PAYMENT_METHOD_LABELS[account.paymentMethod];
                const provider = providerLabel(account.provider);
                const titleLine = provider
                  ? `${provider} · ${methodLabel}`
                  : methodLabel;
                const rowPending = isPending && pendingId === account.id;
                const canMakeDefault =
                  account.verified && account.disbursementReady;

                return (
                  <li
                    key={account.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">
                        {titleLine}
                      </p>
                      <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">
                        {identifier}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {account.verified && (
                          <Badge variant="pos">Verified</Badge>
                        )}
                        {account.defaultAccount && (
                          <Badge variant="outline">Default</Badge>
                        )}
                        {!account.disbursementReady && (
                          <Badge variant="warn">Not disbursable</Badge>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            aria-label={`Actions for ${titleLine} account`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={rowPending}
                            onClick={() => openEdit(account)}
                          >
                            Edit
                          </DropdownMenuItem>

                          {!account.verified && (
                            <DropdownMenuItem
                              disabled={rowPending}
                              onClick={() =>
                                runAction(
                                  account.id,
                                  verifySupplierPaymentAccount,
                                  "Couldn't verify account",
                                )
                              }
                            >
                              Verify
                            </DropdownMenuItem>
                          )}

                          {!account.defaultAccount &&
                            (canMakeDefault ? (
                              <DropdownMenuItem
                                disabled={rowPending}
                                onClick={() =>
                                  runAction(
                                    account.id,
                                    setDefaultSupplierPaymentAccount,
                                    "Couldn't set default account",
                                  )
                                }
                              >
                                Make default
                              </DropdownMenuItem>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block">
                                    <DropdownMenuItem
                                      disabled
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      Make default
                                    </DropdownMenuItem>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  Account must be verified and
                                  disbursement-ready first.
                                </TooltipContent>
                              </Tooltip>
                            ))}

                          <DropdownMenuSeparator />

                          {account.defaultAccount ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block">
                                  <DropdownMenuItem
                                    disabled
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-neg"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                Set another account as default before
                                deleting this one.
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <DropdownMenuItem
                              disabled={rowPending}
                              onClick={() => setDeleteTarget(account)}
                              className="text-neg focus:bg-neg/5 focus:text-neg"
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                );
              })}
            </ul>
          </TooltipProvider>
        )}
      </SectionCard>

      {canManage && (
        <PaymentAccountDialog
          supplierId={supplier.id}
          account={editingAccount}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSaved={() => router.refresh()}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent tone="danger">
          <AlertDialogIcon>
            <Trash2 className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This removes the ${PAYMENT_METHOD_LABELS[deleteTarget.paymentMethod]} account from ${supplier.name}'s payment accounts on file.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
