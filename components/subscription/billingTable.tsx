"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ReceiptText,
} from "lucide-react";
import { getSubscriptionInvoices } from "@/lib/actions/billing-actions";
import { useToast } from "@/hooks/use-toast";
import type { BillingInvoice } from "@/types/billing/types";
import { cn } from "@/lib/utils";

interface BillingHistoryTableProps {
  className?: string;
  subscriptionId?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  PAID: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-gray-50 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-blue-50 text-blue-600 ring-blue-200",
    dot: "bg-blue-400",
  },
};

const ITEMS_PER_PAGE = 10;

const BillingHistoryTable: React.FC<BillingHistoryTableProps> = ({
  className,
  subscriptionId,
}) => {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchInvoices = useCallback(async () => {
    if (!subscriptionId) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSubscriptionInvoices(subscriptionId);
      setInvoices(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [subscriptionId, toast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getStatus = (s: string) =>
    STATUS_CONFIG[s] ?? {
      label: s,
      className: "bg-gray-50 text-gray-600 ring-gray-200",
      dot: "bg-gray-400",
    };

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
          <ReceiptText className="h-4.5 w-4.5 text-violet-600" size={18} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Billing History
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            All invoices and payment records
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2.5" />
          <span className="text-sm">Loading invoices...</span>
        </div>
      )}

      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Invoice", "Date", "Period", "Amount", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        No invoices yet
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => {
                  const s = getStatus(invoice.status);
                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {formatDate(invoice.invoiceDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {formatDate(invoice.periodStart)} &ndash; {formatDate(invoice.periodEnd)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800 text-sm">
                          {invoice.currency} {invoice.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                            s.className,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/40">
          <p className="text-xs text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-600">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}&ndash;
              {Math.min(currentPage * ITEMS_PER_PAGE, invoices.length)}
            </span>{" "}
            of <span className="font-medium text-gray-600">{invoices.length}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 text-xs rounded-lg border-gray-200"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 text-xs rounded-lg border-gray-200"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingHistoryTable;
