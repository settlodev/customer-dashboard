"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  digitalReceiptPaymentDetails,
  physicalReceiptPaymentDetails,
} from "@/lib/actions/settings-actions";
import PaymentMethodSelectorWidget from "@/components/widgets/paymentMethodSelector";
import { PhysicalReceiptPaymentDetails } from "@/types/payments/schema";

export interface PaymentRow {
  id: string;
  methodId: string;
  accountNumber: string;
  notes: string;
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  receiptType: "physical" | "digital";
  initialBankRows?: PaymentRow[];
  initialMnoRows?: PaymentRow[];
  initialRows?: PaymentRow[];
}

const newRow = (): PaymentRow => ({
  id: `${Date.now()}-${Math.random()}`,
  methodId: "",
  accountNumber: "",
  notes: "",
});

const toPayload = (rows: PaymentRow[]): PhysicalReceiptPaymentDetails =>
  rows
    .filter((r) => r.methodId.trim() && r.accountNumber.trim())
    .map((r) => ({
      acceptedPaymentMethodType: r.methodId.trim(),
      accountNumber: r.accountNumber.trim(),
      notes: r.notes.trim(),
    }));

// ─── Component ────────────────────────────────────────────────────────────────
export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  receiptType,
  initialBankRows,
  initialMnoRows,
  initialRows,
}) => {
  const [bankRows, setBankRows] = useState<PaymentRow[]>(
    initialBankRows ?? initialRows ?? [],
  );
  const [mnoRows, setMnoRows] = useState<PaymentRow[]>(
    initialMnoRows ?? initialRows ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBankRows(initialBankRows?.length ? initialBankRows : []);
      setMnoRows(initialMnoRows?.length ? initialMnoRows : []);
    }
  }, [isOpen]);

  // ── Row helpers ─────────────────────────────────────────────────────────────
  const addRow = (set: React.Dispatch<React.SetStateAction<PaymentRow[]>>) =>
    set((prev) => [...prev, newRow()]);

  const removeRow = (
    set: React.Dispatch<React.SetStateAction<PaymentRow[]>>,
    id: string,
  ) => set((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (
    set: React.Dispatch<React.SetStateAction<PaymentRow[]>>,
    id: string,
    field: keyof Omit<PaymentRow, "id">,
    value: string,
  ) =>
    set((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

  const validateRows = (rows: PaymentRow[], kind: string): boolean => {
    for (const row of rows) {
      if (!row.methodId && !row.accountNumber) continue;
      if (!row.methodId) {
        toast({
          variant: "destructive",
          title: "Incomplete entry",
          description: `Please select a ${kind} for every entry.`,
        });
        return false;
      }
      if (!row.accountNumber.trim()) {
        toast({
          variant: "destructive",
          title: "Incomplete entry",
          description: `Please enter an account number for every ${kind} entry.`,
        });
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateRows(bankRows, "bank")) return;
    if (!validateRows(mnoRows, "MNO")) return;

    const payload = toPayload([...bankRows, ...mnoRows]);

    if (payload.length === 0) {
      toast({
        variant: "destructive",
        title: "No entries",
        description: "Please add at least one payment method before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const saveFn =
        receiptType === "physical"
          ? physicalReceiptPaymentDetails
          : digitalReceiptPaymentDetails;

      await saveFn(payload);

      toast({
        title: "Saved",
        description: "Payment details saved successfully.",
      });
      onSaved?.();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description:
          error?.message ?? "Something went wrong. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderRows = (
    rows: PaymentRow[],
    mode: "bank" | "mno",
    set: React.Dispatch<React.SetStateAction<PaymentRow[]>>,
    label: string,
  ) => (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No {label.toLowerCase()} details added yet.
        </div>
      ) : (
        rows.map((row, index) => (
          <div key={row.id} className="border rounded-lg p-4 space-y-3">
            {/* Card header */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {label} {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeRow(set, row.id)}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {/* Method selector */}
            <div className="space-y-1.5">
              <Label>
                {mode === "bank" ? "Bank" : "Mobile Money Operator"}
              </Label>
              <PaymentMethodSelectorWidget
                mode={mode}
                value={row.methodId}
                onChange={(val) => updateRow(set, row.id, "methodId", val)}
                isDisabled={isSaving}
              />
            </div>

            {/* Account / phone number */}
            <div className="space-y-1.5">
              <Label htmlFor={`${mode}-acct-${row.id}`}>
                {mode === "bank" ? "Account Number" : "Phone Number"}
              </Label>
              <Input
                id={`${mode}-acct-${row.id}`}
                placeholder={
                  mode === "bank"
                    ? "e.g., 1234567890"
                    : "e.g., +255 XXX XXX XXX"
                }
                value={row.accountNumber}
                onChange={(e) =>
                  updateRow(set, row.id, "accountNumber", e.target.value)
                }
                disabled={isSaving}
              />
            </div>

            {/* Account name / notes */}
            <div className="space-y-1.5">
              <Label htmlFor={`${mode}-notes-${row.id}`}>
                Account Name{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id={`${mode}-notes-${row.id}`}
                placeholder="e.g., Patrick Bijampola"
                value={row.notes}
                onChange={(e) =>
                  updateRow(set, row.id, "notes", e.target.value)
                }
                disabled={isSaving}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Payment Details —{" "}
            {receiptType === "physical" ? "Physical" : "Digital"} Receipt
          </DialogTitle>
          <DialogDescription>
            Add bank account and mobile money operator (MNO) details to display
            on receipts.
          </DialogDescription>
        </DialogHeader>

        {/* No <form> element — avoids Radix portal native submit issues */}
        <Tabs defaultValue="bank" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank">
              Bank Details
              {bankRows.filter((r) => r.methodId && r.accountNumber).length >
                0 && (
                <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {bankRows.filter((r) => r.methodId && r.accountNumber).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="mno">
              MNO Details
              {mnoRows.filter((r) => r.methodId && r.accountNumber).length >
                0 && (
                <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {mnoRows.filter((r) => r.methodId && r.accountNumber).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Bank tab */}
          <TabsContent value="bank" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Add bank account information
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addRow(setBankRows)}
                disabled={isSaving}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Bank
              </Button>
            </div>
            {renderRows(bankRows, "bank", setBankRows, "Bank Account")}
          </TabsContent>

          {/* MNO tab */}
          <TabsContent value="mno" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Add mobile money operator information
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addRow(setMnoRows)}
                disabled={isSaving}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add MNO
              </Button>
            </div>
            {renderRows(mnoRows, "mno", setMnoRows, "MNO Account")}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Payment Details"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
