"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Loader2, AlertTriangle } from "lucide-react";
import { sharedProforma } from "@/lib/actions/proforma-actions";
import { updateProformaStatusAsConfirmed } from "@/lib/actions/proforma-actions";
import { toast } from "@/hooks/use-toast";
import type { UUID } from "crypto";
import { Proforma } from "@/types/proforma/type";
import {
  DetailsSkeleton,
  InvoiceDocument,
} from "@/components/proforma/proforma-details";

// ─── Accept Modal ─────────────────────────────────────────────────────────────

function AcceptModal({
  open,
  accepting,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  accepting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!accepting ? onCancel : undefined}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <h2 className="text-gray-900 font-bold text-base">
            Confirm Proforma?
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            You are about to confirm this proforma. You will be able to amend it
            — if there are any changes needed, consult the business owner.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={accepting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={onConfirm}
            disabled={accepting}
          >
            {accepting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShareProforma({ proformaId }: { proformaId: string }) {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<Proforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await sharedProforma(proformaId as UUID);
        setData(res as unknown as Proforma);
      } catch {
        toast({ variant: "destructive", title: "Failed to load proforma invoice" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proformaId]);

  const handleConfirmAccept = async () => {
    setAccepting(true);
    try {
      const res = await updateProformaStatusAsConfirmed(proformaId);
      if (res?.responseType === "error") {
        toast({ variant: "destructive", title: res.message });
        return;
      }
      toast({ title: "Proforma confirmed successfully" });
      setData((prev) =>
        prev ? { ...prev, proformaStatus: "CONFIRMED" } : prev,
      );
      setModalOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Something went wrong, please try again" });
    } finally {
      setAccepting(false);
    }
  };

  const isCompleted = data?.proformaStatus === "CONFIRMED";

  return (
    <div className="min-h-screen bg-gray-50/60">
      <AcceptModal
        open={modalOpen}
        accepting={accepting}
        onConfirm={handleConfirmAccept}
        onCancel={() => setModalOpen(false)}
      />

      {/* Top bar */}
      <div className="no-print sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {data && (
            <p className="text-[11px] font-mono text-gray-400 truncate">
              {data.proformaNumber}
            </p>
          )}

          {data && !isCompleted && (
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-3 h-8 sm:h-9"
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-sm">Confirm</span>
            </Button>
          )}

          {data && isCompleted && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3" />
              Confirmed
            </span>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {loading ? (
          <DetailsSkeleton />
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-gray-300" />
            </div>
            <p className="text-gray-700 font-semibold text-sm sm:text-base">
              Proforma not found
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xs">
              This proforma may have been deleted or does not exist.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <InvoiceDocument data={data} printRef={printRef} />
          </div>
        )}
      </div>
    </div>
  );
}
