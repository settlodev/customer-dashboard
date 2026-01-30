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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface BankDetail {
  id: string;
  accountNumber: string;
  accountName: string;
}

export interface MNODetail {
  id: string;
  phoneNumber: string;
  accountName: string;
}

export interface PaymentDetails {
  bankDetails: BankDetail[];
  mnoDetails: MNODetail[];
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: PaymentDetails) => void;
  currentDetails?: PaymentDetails;
  receiptType: "physical" | "digital";
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentDetails,
  receiptType,
}) => {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>(
    currentDetails?.bankDetails || [],
  );
  const [mnoDetails, setMnoDetails] = useState<MNODetail[]>(
    currentDetails?.mnoDetails || [],
  );

  const addBankDetail = () => {
    setBankDetails([
      ...bankDetails,
      { id: Date.now().toString(), accountNumber: "", accountName: "" },
    ]);
  };

  const removeBankDetail = (id: string) => {
    setBankDetails(bankDetails.filter((detail) => detail.id !== id));
  };

  const updateBankDetail = (
    id: string,
    field: keyof BankDetail,
    value: string,
  ) => {
    setBankDetails(
      bankDetails.map((detail) =>
        detail.id === id ? { ...detail, [field]: value } : detail,
      ),
    );
  };

  const addMNODetail = () => {
    setMnoDetails([
      ...mnoDetails,
      { id: Date.now().toString(), phoneNumber: "", accountName: "" },
    ]);
  };

  const removeMNODetail = (id: string) => {
    setMnoDetails(mnoDetails.filter((detail) => detail.id !== id));
  };

  const updateMNODetail = (
    id: string,
    field: keyof MNODetail,
    value: string,
  ) => {
    setMnoDetails(
      mnoDetails.map((detail) =>
        detail.id === id ? { ...detail, [field]: value } : detail,
      ),
    );
  };

  const handleSave = () => {
    // Validate that filled fields are complete
    const incompleteBankDetails = bankDetails.some(
      (detail) =>
        (detail.accountNumber && !detail.accountName) ||
        (!detail.accountNumber && detail.accountName),
    );

    const incompleteMNODetails = mnoDetails.some(
      (detail) =>
        (detail.phoneNumber && !detail.accountName) ||
        (!detail.phoneNumber && detail.accountName),
    );

    if (incompleteBankDetails || incompleteMNODetails) {
      toast({
        variant: "destructive",
        title: "Incomplete details",
        description:
          "Please fill in both account number and name for each entry",
      });
      return;
    }

    // Filter out empty entries
    const validBankDetails = bankDetails.filter(
      (detail) => detail.accountNumber && detail.accountName,
    );
    const validMNODetails = mnoDetails.filter(
      (detail) => detail.phoneNumber && detail.accountName,
    );

    onSave({
      bankDetails: validBankDetails,
      mnoDetails: validMNODetails,
    });

    toast({
      title: "Success",
      description: "Payment details saved successfully",
    });

    onClose();
  };

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

          <TabsContent value="bank" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Add bank account information
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBankDetail}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Bank
              </Button>
            </div>

            {bankDetails.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No bank details added. Click "Add Bank" to add one.
              </div>
            )}

            <div className="space-y-4">
              {bankDetails.map((detail, index) => (
                <div
                  key={detail.id}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">
                      Bank Account {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeBankDetail(detail.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`bank-number-${detail.id}`}>
                        Account Number
                      </Label>
                      <Input
                        id={`bank-number-${detail.id}`}
                        placeholder="e.g., 1234567890"
                        value={detail.accountNumber}
                        onChange={(e) =>
                          updateBankDetail(
                            detail.id,
                            "accountNumber",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`bank-name-${detail.id}`}>
                        Account Name
                      </Label>
                      <Input
                        id={`bank-name-${detail.id}`}
                        placeholder="e.g., Business Account - CRDB Bank"
                        value={detail.accountName}
                        onChange={(e) =>
                          updateBankDetail(
                            detail.id,
                            "accountName",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mno" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Add mobile money operator information
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMNODetail}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add MNO
              </Button>
            </div>

            {mnoDetails.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No MNO details added. Click "Add MNO" to add one.
              </div>
            )}

            <div className="space-y-4">
              {mnoDetails.map((detail, index) => (
                <div
                  key={detail.id}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-sm">
                      MNO Account {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeMNODetail(detail.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`mno-number-${detail.id}`}>
                        Phone Number
                      </Label>
                      <Input
                        id={`mno-number-${detail.id}`}
                        placeholder="e.g., +255 XXX XXX XXX"
                        value={detail.phoneNumber}
                        onChange={(e) =>
                          updateMNODetail(
                            detail.id,
                            "phoneNumber",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`mno-name-${detail.id}`}>
                        Account Name
                      </Label>
                      <Input
                        id={`mno-name-${detail.id}`}
                        placeholder="e.g., M-Pesa - Business Name"
                        value={detail.accountName}
                        onChange={(e) =>
                          updateMNODetail(
                            detail.id,
                            "accountName",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Payment Details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
