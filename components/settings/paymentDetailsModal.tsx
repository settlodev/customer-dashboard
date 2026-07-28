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
import { Plus, Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  getAllDigitalReceiptPaymentDetails,
  getAllPhysicalReceiptPaymentDetails,
  updatePhysicalReceiptPaymentDetails,
  updateDigitalReceiptPaymentDetails,
  physicalReceiptPaymentDetails,
  digitalReceiptPaymentDetails,
} from "@/lib/actions/settings-actions";
import PaymentMethodSelectorWidget from "@/components/widgets/paymentMethodSelector";
import { PhysicalReceiptPaymentDetails } from "@/types/payments/schema";

export interface PaymentRow {
  id: string;
  serverId?: string;
  methodId: string;
  accountNumber: string;
  notes: string;
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  receiptType: "physical" | "digital";
}

const newRow = (): PaymentRow => ({
  id: `${Date.now()}-${Math.random()}`,
  serverId: undefined,
  methodId: "",
  accountNumber: "",
  notes: "",
});

const toPayload = (rows: PaymentRow[]): PhysicalReceiptPaymentDetails =>
  rows
    .filter((r) => r.methodId.trim() && r.accountNumber.trim())
    .map((r) => ({
      ...(r.serverId ? { id: r.serverId } : {}), // ← spreads id only when present
      acceptedPaymentMethodType: r.methodId.trim(),
      accountNumber: r.accountNumber.trim(),
      notes: r.notes.trim(),
    }));

const mapApiToRow = (item: any): PaymentRow => ({
  id: `${Date.now()}-${Math.random()}`, // local React key only
  serverId: item.id, // ← this was missing
  methodId: item.acceptedPaymentMethodType ?? "",
  accountNumber: item.accountNumber ?? "",
  notes: item.notes ?? "",
});

const isBank = (item: any): boolean =>
  item.acceptedPaymentMethodTypeName?.toLowerCase().includes("bank") ?? false;

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  receiptType,
}) => {
  const [bankRows, setBankRows] = useState<PaymentRow[]>([]);
  const [mnoRows, setMnoRows] = useState<PaymentRow[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setIsFetching(true);
      try {
        const fetchFn =
          receiptType === "physical"
            ? getAllPhysicalReceiptPaymentDetails
            : getAllDigitalReceiptPaymentDetails;

        const data = await fetchFn();
        const list: any[] = Array.isArray(data) ? data : (data?.data ?? []);

        setBankRows(list.filter(isBank).map(mapApiToRow));
        setMnoRows(list.filter((d) => !isBank(d)).map(mapApiToRow));
      } catch {
        toast({
          variant: "destructive",
          title: "Failed to load",
          description: "Could not load existing payment details.",
        });
      } finally {
        setIsFetching(false);
      }
    };

    load();
  }, [isOpen, receiptType]);

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

    const allRows = toPayload([...bankRows, ...mnoRows]);

    if (allRows.length === 0) {
      toast({
        variant: "destructive",
        title: "No entries",
        description: "Please add at least one payment method before saving.",
      });
      return;
    }

    // Split by presence of id
    const toCreate = allRows.filter((r) => !r.id);
    const toUpdate = allRows.filter((r) => !!r.id);

    const createFn =
      receiptType === "physical"
        ? physicalReceiptPaymentDetails
        : digitalReceiptPaymentDetails;

    const updateFn =
      receiptType === "physical"
        ? updatePhysicalReceiptPaymentDetails
        : updateDigitalReceiptPaymentDetails;

    setIsSaving(true);
    try {
      await Promise.all(
        [
          toCreate.length > 0 ? createFn(toCreate) : null,
          toUpdate.length > 0 ? updateFn(toUpdate) : null,
        ].filter(Boolean),
      );

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
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {label} {index + 1}
              </span>
            </div>

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

            <div className="space-y-1.5">
              <Label htmlFor={`${mode}-acct-${row.id}`}>
                {mode === "bank" ? "Account Number" : "Lipa Number"}
              </Label>
              <Input
                id={`${mode}-acct-${row.id}`}
                placeholder={
                  mode === "bank" ? "e.g., 1234567890" : "e.g.,  130 XXX XXX"
                }
                value={row.accountNumber}
                onChange={(e) =>
                  updateRow(set, row.id, "accountNumber", e.target.value)
                }
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${mode}-notes-${row.id}`}>
                Account Name{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id={`${mode}-notes-${row.id}`}
                placeholder="e.g., Lipa Settlo Technologies Limited"
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

        {isFetching ? (
          <div className="flex items-center justify-center py-16">
            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="bank" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bank">
                Bank Details
                {bankRows.filter((r) => r.methodId && r.accountNumber).length >
                  0 && (
                  <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    {
                      bankRows.filter((r) => r.methodId && r.accountNumber)
                        .length
                    }
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="mno">
                MNO Details
                {mnoRows.filter((r) => r.methodId && r.accountNumber).length >
                  0 && (
                  <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    {
                      mnoRows.filter((r) => r.methodId && r.accountNumber)
                        .length
                    }
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

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
                  <Plus className="h-4 w-4 mr-1" /> Add Bank
                </Button>
              </div>
              {renderRows(bankRows, "bank", setBankRows, "Bank Account")}
            </TabsContent>

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
                  <Plus className="h-4 w-4 mr-1" /> Add MNO
                </Button>
              </div>
              {renderRows(mnoRows, "mno", setMnoRows, "MNO Account")}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isFetching}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isFetching}
          >
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
