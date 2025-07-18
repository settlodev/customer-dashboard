"use client";

import {CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Purchase } from "@/types/warehouse/purchase/type";
import { PurchaseSchema } from "@/types/warehouse/purchase/schema";
import { toast } from "@/hooks/use-toast";
import { payStockIntakePurchase } from "@/lib/actions/warehouse/purchases-action";

interface CellActionProps {
  data: Purchase;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Listen for payment dialog events from the Pay button
  useEffect(() => {
    const handlePaymentDialog = (event: CustomEvent) => {
      if (event.detail.purchase.id === data.id) {
        setIsPaymentDialogOpen(true);
      }
    };

    window.addEventListener('openPaymentDialog', handlePaymentDialog as EventListener);
    return () => {
      window.removeEventListener('openPaymentDialog', handlePaymentDialog as EventListener);
    };
  }, [data.id]);

  const handlePayment = async () => {
    // Validate the payment data using Zod schema
    const validationResult = PurchaseSchema.safeParse({
      amount: paymentAmount
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Invalid payment amount";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    const { amount } = validationResult.data;

    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (amount > data.unpaidAmount) {
      toast({
        title: "Amount Too High",
        description: "Payment amount cannot exceed the unpaid amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
     const response= await payStockIntakePurchase(data.id, amount);
      
       if(response){
        setIsPaymentDialogOpen(false);
        setPaymentAmount("");
        
        router.refresh();
       }
     
    } catch (error) {
      console.log("Error:", error);
      toast({
        title: "Payment Error",
        description: "An error occurred while processing the payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-2">

        {data.paymentStatus === "PARTIAL" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaymentDialogOpen(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay
          </Button>
        )}
        
        {/* <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/purchases/${data.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" /> Update
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Enter the payment amount for Stock Intake Purchase Number: {data.stockIntakePurchaseNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unpaid-amount" className="text-right">
                Unpaid Amount:
              </Label>
              <div className="col-span-3 font-semibold">
                {data.unpaidAmount.toFixed(2)}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-amount" className="text-right">
                Payment Amount:
              </Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                max={data.unpaidAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsPaymentDialogOpen(false);
                setPaymentAmount("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handlePayment}
              disabled={isProcessing || !paymentAmount}
            >
              {isProcessing ? "Processing..." : "Pay Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};