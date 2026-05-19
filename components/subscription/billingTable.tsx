"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ReceiptText,
} from "lucide-react";
import { searchInvoices } from "@/lib/actions/invoice-actions";
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "@/types/invoice/type";
import { cn } from "@/lib/utils";

interface BillingHistoryTableProps {
  className?: string;
  locationId?: string;
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
  NOT_PAID: {
    label: "Unpaid",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  overdue: {
    label: "Overdue",
    className: "bg-orange-50 text-orange-700 ring-orange-200",
    dot: "bg-orange-500",
  },
};

const BillingHistoryTable: React.FC<BillingHistoryTableProps> = ({
  className,
  locationId,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const { toast } = useToast();

  const fetchInvoices = useCallback(
    async (page: number = 1, search: string = "") => {
      setLoading(true);
      try {
        const response = await searchInvoices(
          search,
          page,
          itemsPerPage,
          locationId,
        );
        setInvoices(response.content);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.totalElements || 0);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch invoices",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [locationId, itemsPerPage, toast],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => setCurrentPage(1), [debouncedSearchTerm]);

  useEffect(() => {
    fetchInvoices(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, fetchInvoices]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const status = (s: string) =>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
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

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search invoices…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm rounded-xl border-gray-200 focus:border-gray-300"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2.5" />
          <span className="text-sm">Loading invoices…</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Invoice", "Date", "Amount", "Status"].map((h) => (
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
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        No invoices found
                      </p>
                      <p className="text-xs text-gray-400">
                        Try adjusting your search
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const s = status(invoice.paymentStatus);
                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Invoice number */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                          {invoice.invoiceNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {formatDate(invoice.dateCreated)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800 text-sm">
                          TZS {invoice.totalAmount.toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                            s.className,
                          )}
                        >
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", s.dot)}
                          />
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/40">
          <p className="text-xs text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-600">
              {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-medium text-gray-600">{totalItems}</span>
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

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-8 w-8 p-0 text-xs rounded-lg",
                    currentPage === page
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-600 hover:bg-gray-100",
                  )}
                >
                  {page}
                </Button>
              );
            })}

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
