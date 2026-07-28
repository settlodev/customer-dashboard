import { notFound, redirect } from "next/navigation";
import { validate as validateUUID } from "uuid";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { ApiResponse } from "@/types/types";
import { Expense } from "@/types/expense/type";
import { getExpense } from "@/lib/actions/expense-actions";
import { ReceiptIcon } from "lucide-react";
import Link from "next/link";
import { UUID } from "node:crypto";

type Params = Promise<{ id: string }>;

export default async function ExpensesPage({ params }: { params: Params }) {
  const resolvedParams = await params;

  // Handle new expense creation
  if (resolvedParams.id === "new") {
    redirect("/expenses/new/edit");
  }

  // Validate UUID format
  if (!validateUUID(resolvedParams.id)) {
    notFound();
  }

  let item: ApiResponse<Expense> | null = null;

  try {
    item = await getExpense(resolvedParams.id as UUID);

    // Check if response has valid data
    if (!item?.content || item.content.length === 0) {
      notFound();
    }
  } catch (error) {
    console.error("Failed to load expense:", error);
    throw new Error("Failed to load expense data");
  }

  const expense = item.content[0];

  const breadcrumbItems = [
    { title: "Expense", link: "/expenses" },
    { title: expense.name, link: "" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1 md:max-w-md">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
      </div>

      <ExpenseCard item={expense} />
    </div>
  );
}

const ExpenseCard = ({ item }: { item: Expense | null | undefined }) => {
  if (!item) return null;

  const paymentStatusConfig = {
    PAID: {
      label: "Paid",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    UNPAID: {
      label: "Unpaid",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    PARTIAL: {
      label: "Partial",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
  };

  const status =
    paymentStatusConfig[item.paymentStatus as keyof typeof paymentStatusConfig];

  const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const initials =
    item.staffName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "??";

  const receiptExtension =
    item.receiptUrl?.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{item.name}</CardTitle>
          <CardDescription>
            {item.expenseCategoryName} &nbsp;·&nbsp; {formattedDate}
          </CardDescription>
        </div>
        {status && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border ${status.className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status.label}
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amount summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total amount", value: item.amount, color: "" },
            { label: "Paid", value: item.paidAmount, color: "text-green-700" },
            {
              label: "Outstanding",
              value: item.unpaidAmount,
              color: item.unpaidAmount > 0 ? "text-red-700" : "",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-xl font-medium ${color}`}>
                {value?.toLocaleString() ?? "0"}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Details grid */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Details
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: "Category", value: item.expenseCategoryName },
              { label: "Expense date", value: formattedDate },
              {
                label: "Due date",
                value: item.dueDate
                  ? new Date(item.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null,
              },
              { label: "Supplier", value: item.supplierName },
              { label: "Notes", value: item.notes },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span
                  className={`text-sm ${!value ? "text-muted-foreground italic" : ""}`}
                >
                  {value ?? "—"}
                </span>
              </div>
            ))}

            {/* Recorded by */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Recorded by</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {initials}
                </div>
                <span className="text-sm">{item.staffName ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt — only shown when receiptUrl exists */}
        {item.receiptUrl && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Receipt
              </p>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ReceiptIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Receipt image</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded · {receiptExtension}
                  </p>
                </div>
                <a
                  href={item.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                >
                  View ↗
                </a>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
