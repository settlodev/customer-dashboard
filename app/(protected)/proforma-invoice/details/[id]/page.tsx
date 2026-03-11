"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileText } from "lucide-react";
import { getProforma } from "@/lib/actions/proforma-actions";
import ProformaDownloadButton from "@/components/widgets/proforma-download";

import { toast } from "sonner";
import type { UUID } from "crypto";
import { Proforma } from "@/types/proforma/type";
import {
  DetailsSkeleton,
  InvoiceDocument,
} from "@/components/proforma/proforma-details";

type Params = Promise<{ id: string }>;

const ProformaInvoiceDetails = ({ params }: { params: Params }) => {
  const { id } = use(params);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<Proforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProforma(id as UUID);
        setData(res as unknown as Proforma);
      } catch {
        toast.error("Failed to load proforma invoice");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/proforma/shared/${id}`,
      );
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy link");
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {loading ? (
          <DetailsSkeleton />
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold text-sm sm:text-base">
              Invoice not found
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xs">
              This proforma invoice may have been deleted or does not exist.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 sm:mt-5"
              onClick={() => router.push("/proforma-invoice")}
            >
              Back to list
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <InvoiceDocument data={data} printRef={printRef} />

            {/* ── Action row ── */}
            <div className="no-print flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 sm:gap-3 pb-4 sm:pb-6">
              <ProformaDownloadButton
                proformaNumber={data.proformaNumber}
                className="flex justify-center items-center gap-2 w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="gap-2 w-full sm:w-auto"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 shrink-0" />
                )}
                <span>{copied ? "Copied!" : "Copy link"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProformaInvoiceDetails;
