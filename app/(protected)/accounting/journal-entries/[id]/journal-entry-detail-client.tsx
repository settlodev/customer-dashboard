"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import {
  postJournalEntry,
  voidJournalEntry,
} from "@/lib/actions/journal-entry-actions";
import JournalEntryForm from "@/components/forms/journal_entry_form";
import type { JournalEntry } from "@/types/journal-entry/type";

interface Props {
  entry: JournalEntry;
}

export function JournalEntryDetailClient({ entry }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmVoid, setConfirmVoid] = useState(false);

  const handle = (
    fn: () => Promise<{ responseType: string; message: string }>,
  ) =>
    startTransition(async () => {
      const result = await fn();
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Success" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") router.refresh();
    });

  const canPost = entry.status === "DRAFT" && entry.balanced;
  const canVoid = entry.status === "POSTED";
  const canEdit = entry.status === "DRAFT";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canPost && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => handle(() => postJournalEntry(entry.id))}
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Post entry
          </Button>
        )}
        {canVoid && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-red-600 hover:text-red-700"
            disabled={isPending}
            onClick={() => setConfirmVoid(true)}
          >
            <Undo2 className="mr-1.5 h-3.5 w-3.5" />
            Void entry
          </Button>
        )}
      </div>

      <Tabs defaultValue={canEdit ? "edit" : "lines"}>
        <TabsList>
          {canEdit && <TabsTrigger value="edit">Edit</TabsTrigger>}
          <TabsTrigger value="lines">Lines ({entry.lines.length})</TabsTrigger>
        </TabsList>

        {canEdit && (
          <TabsContent value="edit" className="mt-4">
            <JournalEntryForm item={entry} defaultCurrency={entry.currencyCode} />
          </TabsContent>
        )}

        <TabsContent value="lines" className="mt-4">
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Memo</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entry.lines.map((l, i) => (
                      <tr key={l.id ?? i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs">
                          {l.chartOfAccountId.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {l.description ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {l.debitAmount > 0
                            ? l.debitAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {l.creditAmount > 0
                            ? l.creditAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-gray-50/60">
                      <td className="px-4 py-3 font-medium">Totals</td>
                      <td />
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                        {entry.totalDebit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                        {entry.totalCredit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                {entry.balanced ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Balanced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <ShieldAlert className="h-3.5 w-3.5" /> Unbalanced — cannot
                    post
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmVoid} onOpenChange={setConfirmVoid}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this journal entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {entry.entryNumber} will be marked VOIDED and reversed in the
              ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => handle(() => voidJournalEntry(entry.id))}
            >
              Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
