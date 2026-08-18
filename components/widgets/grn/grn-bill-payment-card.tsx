"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ExpensePaymentForm from "@/components/forms/expense_payment_form";
import type { Expense } from "@/types/expense/type";

interface Props {
  expense: Expense;
  prefillAmount: number;
}

/**
 * Persistent "record payment" affordance on the GRN detail page. Rendered by the
 * server page only when the linked bill is open (APPROVED && !PAID). Opens the
 * shared ExpensePaymentForm prefilled with this delivery's value.
 */
export default function GrnBillPaymentCard({ expense, prefillAmount }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-medium text-ink">Unpaid supplier bill</p>
        <p className="text-xs text-muted-foreground">
          {expense.expenseNumber} · {expense.currencyCode}{" "}
          {expense.balanceDue.toLocaleString()} outstanding
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Record payment
      </Button>
      <ExpensePaymentForm
        expense={expense}
        prefillAmount={prefillAmount}
        open={open}
        onOpenChange={setOpen}
        onRecorded={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </Card>
  );
}
