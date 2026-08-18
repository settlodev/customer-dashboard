import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExpense, getExpenseTimeline } from "@/lib/actions/expense-actions";
import { listExpensePayments } from "@/lib/actions/expense-payment-actions";
import { listExpenseCreditNotes } from "@/lib/actions/expense-credit-note-actions";
import { listExpenseAttachments } from "@/lib/actions/expense-attachment-actions";
import { getAccountingLocationSettings } from "@/lib/actions/accounting-location-settings-actions";
import {
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from "@/types/expense/type";

import ExpenseForm from "@/components/forms/expense_form";
import { ExpenseDetailClient } from "./expense-detail-client";

type Params = Promise<{ id: string }>;

export default async function ExpensesDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const isNew = id === "new";

  // Pull merchant defaults from the accounting service's settings cache.
  // The cache is hydrated by Kafka events from the Accounts Service —
  // see LocationSettingsConsumer in the accounting service.
  const settings = await getAccountingLocationSettings();
  const defaultCurrency =
    settings.currency || settings.defaultCurrency || "TZS";
  const defaultDueDays = settings.defaultInvoiceDueDays ?? null;

  if (isNew) {
    return (
      <PageShell>
        <PageBreadcrumbs
          items={[{ title: "Expenses", href: "/expenses" }, { title: "New" }]}
        />
        <PageHeader
          title="Record expense"
          subtitle="Capture a vendor bill — saved as DRAFT until you submit it for approval."
        />
        <PageBody>
          <ExpenseForm
            item={null}
            defaultCurrency={defaultCurrency}
            defaultDueDays={defaultDueDays}
          />
        </PageBody>
      </PageShell>
    );
  }

  const expense = await getExpense(id);

  if (!expense) notFound();

  const [payments, creditNotes, attachments, timeline] = await Promise.all([
    listExpensePayments(expense.id),
    listExpenseCreditNotes(expense.id),
    listExpenseAttachments(expense.id),
    getExpenseTimeline(expense.id),
  ]);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Expenses", href: "/expenses" },
          { title: expense.expenseNumber },
        ]}
      />
      <PageHeader
        title={expense.expenseNumber}
        subtitle={expense.description ?? undefined}
        titleAccessory={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EXPENSE_STATUS_TONES[expense.status]}`}
            >
              {EXPENSE_STATUS_LABELS[expense.status]}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_TONES[expense.paymentStatus]}`}
            >
              {PAYMENT_STATUS_LABELS[expense.paymentStatus]}
            </span>
          </div>
        }
      />

      <PageBody>
        <ExpenseDetailClient
          expense={expense}
          payments={payments}
          creditNotes={creditNotes}
          attachments={attachments}
          timeline={timeline}
          defaultCurrency={defaultCurrency}
          defaultDueDays={defaultDueDays}
        />
      </PageBody>
    </PageShell>
  );
}
