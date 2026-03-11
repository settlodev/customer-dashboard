"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  FileText,
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  getProforma,
  convertProformaToInvoice,
} from "@/lib/actions/proforma-actions";
import ProformaDownloadButton from "@/components/widgets/proforma-download";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { UUID } from "crypto";
import { Proforma } from "@/types/proforma/type";
import {
  DetailsSkeleton,
  InvoiceDocument,
} from "@/components/proforma/proforma-details";
import StaffSelectorWidget from "@/components/widgets/staff_selector_widget";

// ─── Convert Modal ────────────────────────────────────────────────────────────

function ConvertToInvoiceModal({
  proformaId,
  proformaNumber,
  onSuccess,
}: {
  proformaId: string;
  proformaNumber: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [staffId, setStaffId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!staffId) {
      setError("Please select a staff member to proceed.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await convertProformaToInvoice(
        proformaId,
        staffId as UUID,
      );
      if (result?.responseType === "error") {
        setError(result.message ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      toast.success("Proforma converted to invoice successfully");
      setOpen(false);
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 w-full sm:w-auto bg-[#EB7F44] text-white shadow-sm"
      >
        <ArrowRightLeft className="w-4 h-4 shrink-0" />
        <span>Convert to Invoice</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!loading) {
            setOpen(o);
            if (!o) setError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
              Convert Proforma to Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-1">
            {/* Warning notice */}
            <div className="flex gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  You&apos;re about to convert this proforma to an invoice or
                  unpaid order.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Proforma{" "}
                  <span className="font-mono font-semibold">
                    {proformaNumber}
                  </span>{" "}
                  will become a confirmed order. This action cannot be undone.
                </p>
              </div>
            </div>

            <Separator />

            {/* Staff selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Assign Staff Member <span className="text-red-400">*</span>
              </Label>
              <p className="text-xs text-gray-400">
                Select the staff member responsible for accepting this order.
              </p>
              <StaffSelectorWidget
                label="Staff"
                placeholder="Select staff member…"
                isRequired
                value={staffId}
                onChange={(v) => {
                  setStaffId(v);
                  setError(null);
                }}
                onBlur={() => {}}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvert}
                disabled={loading || !staffId}
                className="bg-[#EB7F44] hover:bg-[#EB7F44] text-white min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting…
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Confirm & Convert
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Params = Promise<{ id: string }>;

const ProformaInvoiceDetails = ({ params }: { params: Params }) => {
  const { id } = use(params);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<Proforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getProforma(id as UUID);
      setData(res as unknown as Proforma);
    } catch {
      toast.error("Failed to load proforma invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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

  // Re-fetch after conversion so status updates to ACCEPTED and buttons hide
  const handleConvertSuccess = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  const isComplete = data?.proformaStatus === "COMPLETE";
  const isAccepted = data?.proformaStatus === "ACCEPTED";

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

            {/* ── Action row — hidden entirely when ACCEPTED ── */}
            {!isAccepted && (
              <div className="no-print flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 sm:gap-3 pb-4 sm:pb-6">
                {/* Download always shown (unless ACCEPTED) */}
                <ProformaDownloadButton
                  proformaNumber={data.proformaNumber}
                  className="flex justify-center items-center gap-2 w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-black bg-[#EAEAE5] rounded-lg hover:bg-[#EAEAE5] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                />

                {/* Copy link — hidden when COMPLETE */}
                {!isComplete && (
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
                )}

                {/* Convert button — only when COMPLETE */}
                {isComplete && (
                  <ConvertToInvoiceModal
                    proformaId={data.id}
                    proformaNumber={data.proformaNumber}
                    onSuccess={handleConvertSuccess}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProformaInvoiceDetails;
