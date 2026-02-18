"use client";
import React, { useState } from "react";
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

interface PaymentRow {
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
  initialRows?: PaymentRow[];
}

const emptyRow = (): PaymentRow => ({
  id: Date.now().toString() + Math.random(),
  methodId: "",
  accountNumber: "",
  notes: "",
});

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  receiptType,
  initialRows,
}) => {
  const [bankRows, setBankRows] = useState<PaymentRow[]>(initialRows ?? []);
  const [mnoRows, setMnoRows] = useState<PaymentRow[]>(initialRows ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const addRow = (setter: React.Dispatch<React.SetStateAction<PaymentRow[]>>) =>
    setter((prev) => [...prev, emptyRow()]);

  const removeRow = (
    setter: React.Dispatch<React.SetStateAction<PaymentRow[]>>,
    id: string,
  ) => setter((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (
    setter: React.Dispatch<React.SetStateAction<PaymentRow[]>>,
    id: string,
    field: keyof Omit<PaymentRow, "id">,
    value: string,
  ) =>
    setter((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

  const validateRows = (rows: PaymentRow[], label: string): boolean => {
    for (const row of rows) {
      if (!row.methodId && !row.accountNumber) continue;
      if (!row.methodId) {
        toast({
          variant: "destructive",
          title: "Incomplete details",
          description: `Please select a ${label} for every entry.`,
        });
        return false;
      }
      if (!row.accountNumber.trim()) {
        toast({
          variant: "destructive",
          title: "Incomplete details",
          description: `Please enter an account number for every ${label} entry.`,
        });
        return false;
      }
    }
    return true;
  };

  const toPayload = (rows: PaymentRow[]): PhysicalReceiptPaymentDetails =>
    rows
      .filter((r) => r.methodId && r.accountNumber.trim())
      .map((r) => ({
        acceptedPaymentMethodType: r.methodId,
        accountNumber: r.accountNumber.trim(),
        notes: r.notes.trim(),
      }));

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

    try {
      setIsSaving(true);
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
    setter: React.Dispatch<React.SetStateAction<PaymentRow[]>>,
    label: string,
  ) => (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div key={row.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">
              {label} {index + 1}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeRow(setter, row.id)}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <div className="grid gap-3">
            {/* Bank / MNO selector */}
            <div className="space-y-1">
              <Label>
                {mode === "bank" ? "Bank" : "Mobile Money Operator"}
              </Label>
              <PaymentMethodSelectorWidget
                mode={mode}
                value={row.methodId}
                onChange={(value) =>
                  updateRow(setter, row.id, "methodId", value)
                }
                isDisabled={isSaving}
              />
            </div>

            {/* Account number / phone number */}
            <div className="space-y-1">
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
                  updateRow(setter, row.id, "accountNumber", e.target.value)
                }
                disabled={isSaving}
              />
            </div>

            {/* Notes (optional) */}
            <div className="space-y-1">
              <Label htmlFor={`${mode}-notes-${row.id}`}>
                Notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id={`${mode}-notes-${row.id}`}
                placeholder="e.g., Primary business account"
                value={row.notes}
                onChange={(e) =>
                  updateRow(setter, row.id, "notes", e.target.value)
                }
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Payment Details for{" "}
            {receiptType === "physical" ? "Physical" : "Digital"} Receipt
          </DialogTitle>
          <DialogDescription>
            Add bank account and mobile money operator (MNO) details to display
            on receipts
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bank" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
            <TabsTrigger value="mno">MNO Details</TabsTrigger>
          </TabsList>

          {/* ── Bank Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="bank" className="space-y-4 mt-4">
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

            {bankRows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bank details added. Click &quot;Add Bank&quot; to add one.
              </div>
            ) : (
              renderRows(bankRows, "bank", setBankRows, "Bank Account")
            )}
          </TabsContent>

          {/* ── MNO Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="mno" className="space-y-4 mt-4">
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

            {mnoRows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No MNO details added. Click &quot;Add MNO&quot; to add one.
              </div>
            ) : (
              renderRows(mnoRows, "mno", setMnoRows, "MNO Account")
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
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
