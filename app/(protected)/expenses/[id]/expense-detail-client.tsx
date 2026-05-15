"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  Paperclip,
  Plus,
  Receipt,
  Send,
  ShieldCheck,
  ShieldX,
  Trash2,
  Undo2,
} from "lucide-react";

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
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import {
  approveExpense,
  rejectExpense,
  submitExpense,
  voidExpense,
} from "@/lib/actions/expense-actions";
import {
  deleteExpensePayment,
} from "@/lib/actions/expense-payment-actions";
import {
  deleteExpenseAttachment,
  registerExpenseAttachments,
} from "@/lib/actions/expense-attachment-actions";
import type { UploadAttachmentMetadata } from "@/components/forms/expense_payment_form";

import ExpenseForm from "@/components/forms/expense_form";
import ExpensePaymentForm, {
  UploadAttachmentTrigger,
} from "@/components/forms/expense_payment_form";
import type {
  Expense,
  ExpenseAttachment,
  ExpenseTimelineEvent,
} from "@/types/expense/type";
import type { ExpensePayment } from "@/types/expense-payment/type";

interface Props {
  expense: Expense;
  payments: ExpensePayment[];
  attachments: ExpenseAttachment[];
  timeline: ExpenseTimelineEvent[];
  defaultCurrency: string;
  defaultDueDays?: number | null;
}

const fmt = (n: number, c: string) =>
  `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export function ExpenseDetailClient({
  expense,
  payments,
  attachments,
  timeline,
  defaultCurrency,
  defaultDueDays,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
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

  const onUploaded = async (metadata: UploadAttachmentMetadata) => {
    const result = await registerExpenseAttachments(expense.id, [metadata]);
    toast({
      variant: result.responseType === "success" ? "success" : "destructive",
      title: result.responseType === "success" ? "Uploaded" : "Error",
      description: result.message,
    });
    if (result.responseType === "success") router.refresh();
  };

  const canEdit = expense.status === "DRAFT" || expense.status === "REJECTED";
  const canSubmit = expense.status === "DRAFT";
  const canApprove = expense.status === "PENDING";
  const canVoid =
    expense.status === "APPROVED" || expense.status === "PENDING";
  const canPay =
    expense.status === "APPROVED" && expense.paymentStatus !== "PAID";

  return (
    <>
      <KpiStrip cols={4}>
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Total"
          value={expense.totalAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={expense.currencyCode}
        />
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Paid"
          value={expense.paidAmount.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={expense.currencyCode}
          deltaTone="pos"
        />
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Outstanding"
          value={expense.balanceDue.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          unit={expense.currencyCode}
          deltaTone={expense.balanceDue > 0 ? "neg" : "pos"}
        />
        <KpiCard
          icon={<CalendarDays className="h-3 w-3" />}
          label="Expense date"
          value={
            expense.expenseDate
              ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  new Date(expense.expenseDate),
                )
              : "—"
          }
          delta={
            expense.dueDate
              ? `due ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  new Date(expense.dueDate),
                )}`
              : undefined
          }
          deltaTone="neutral"
        />
      </KpiStrip>

      {/* Workflow action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {canSubmit && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => handle(() => submitExpense(expense.id))}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Submit for approval
          </Button>
        )}
        {canApprove && (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handle(() => approveExpense(expense.id))}
            >
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handle(() => rejectExpense(expense.id))}
            >
              <ShieldX className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
          </>
        )}
        {canPay && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPaymentSheetOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record payment
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
            Void
          </Button>
        )}
        <UploadAttachmentTrigger
          isPending={isPending}
          onUploaded={onUploaded}
        />
      </div>

      <Tabs defaultValue={canEdit ? "edit" : "payments"}>
        <TabsList>
          {canEdit && <TabsTrigger value="edit">Edit</TabsTrigger>}
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="attachments">
            Attachments ({attachments.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            Timeline ({timeline.length})
          </TabsTrigger>
        </TabsList>

        {canEdit && (
          <TabsContent value="edit" className="mt-4">
            <ExpenseForm
              item={expense}
              defaultCurrency={defaultCurrency}
              defaultDueDays={defaultDueDays}
            />
          </TabsContent>
        )}

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Vendor" value={expense.vendorId ?? "—"} />
              <DetailItem
                label="Category"
                value={expense.expenseCategoryId ?? "—"}
              />
              <DetailItem
                label="Reference"
                value={expense.reference ?? "—"}
              />
              <DetailItem
                label="Currency"
                value={`${expense.currencyCode}${expense.exchangeRate ? ` @ ${expense.exchangeRate}` : ""}`}
              />
              <DetailItem
                label="Net amount"
                value={fmt(expense.amount, expense.currencyCode)}
              />
              <DetailItem
                label="Tax amount"
                value={
                  expense.taxAmount
                    ? fmt(expense.taxAmount, expense.currencyCode)
                    : "—"
                }
              />
              <DetailItem
                label="Approved by"
                value={
                  expense.approvedBy
                    ? `${expense.approvedBy.slice(0, 8)}…`
                    : "—"
                }
              />
              <DetailItem
                label="Approved at"
                value={
                  expense.approvedAt
                    ? new Date(expense.approvedAt).toLocaleString()
                    : "—"
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              {payments.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">From account</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-xs">
                            {new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                            }).format(new Date(p.paymentDate))}
                          </td>
                          <td className="px-4 py-3">
                            {p.sourceAccountName ?? p.sourceAccountId.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3">
                            {p.paymentMethod ?? p.paymentMethodCode ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {p.reference ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            {fmt(p.amount, p.currencyCode)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() =>
                                handle(() =>
                                  deleteExpensePayment(expense.id, p.id),
                                )
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {attachments.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No attachments yet. Upload a receipt or invoice scan above.
                </div>
              ) : (
                <ul className="divide-y">
                  {attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {a.originalFileName}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {a.contentType} · {fmtBytes(a.fileSize)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() =>
                            handle(() =>
                              deleteExpenseAttachment(expense.id, a.id),
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No events yet.
                </div>
              ) : (
                <ol className="space-y-3">
                  {timeline.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className="font-medium">{e.eventType}</span>
                          {e.description ? ` — ${e.description}` : ""}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {e.staffName ?? "system"} ·{" "}
                          {new Date(e.occurredAt).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExpensePaymentForm
        expense={expense}
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        onRecorded={() => router.refresh()}
      />

      <AlertDialog open={confirmVoid} onOpenChange={setConfirmVoid}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {expense.expenseNumber} will be reversed in the journal.
              This action is recorded but cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => handle(() => voidExpense(expense.id))}
            >
              Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm">{value}</p>
    </div>
  );
}
