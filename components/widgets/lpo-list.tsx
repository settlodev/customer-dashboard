"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  CheckCircle2,
  Search,
  Calendar,
  Package,
  FileText,
  AlertCircle,
  Phone,
  Mail,
  Hash,
  Clock,
  Building2,
} from "lucide-react";
import { StockPurchase } from "@/types/stock-purchases/type";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { stockIntakeReceiptSchema } from "@/types/stock-intake/schema";
import { receivePurchaseOrderAsStockIntake } from "@/lib/actions/stock-purchase-actions";
import StaffSelectorWidget from "@/components/widgets/staff_selector_widget";

interface LPOSelectionListProps {
  lpos: StockPurchase[];
}

interface ReceivedQuantities {
  [lpoOrderNumber: string]: {
    [itemId: string]: {
      quantity: number;
      unitCost: number;
    };
  };
}

interface ReceiptDialogData {
  lpoId: string;
  lpoOrderNumber: string;
  staffId: string;
  receivedAt: string;
  notes: string;
}

export function LPOSelectionList({ lpos }: LPOSelectionListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [receivedQuantities, setReceivedQuantities] =
    useState<ReceivedQuantities>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedLPO, setSelectedLPO] = useState<string | null>(null);

  const getLocalDateTimeForInput = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getMaxLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const localToUTCISO = (localDateTimeString: string) => {
    return new Date(localDateTimeString).toISOString();
  };

  const [receiptData, setReceiptData] = useState<ReceiptDialogData>({
    lpoId: "",
    lpoOrderNumber: "",
    staffId: "",
    receivedAt: getLocalDateTimeForInput(),
    notes: "",
  });

  const isNotesRequired = (lpoOrderNumber: string) => {
    const lpo = lpos.find((l) => l.orderNumber === lpoOrderNumber);
    if (!lpo) return false;
    const quantities = receivedQuantities[lpoOrderNumber] || {};
    return lpo.stockIntakePurchaseOrderItems.some((item) => {
      const received = quantities[item.id]?.quantity;
      return typeof received === "number" && received < item.quantity;
    });
  };

  const filteredLPOs = lpos.filter((lpo) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      lpo.orderNumber.toLowerCase().includes(searchLower) ||
      lpo.supplierName.toLowerCase().includes(searchLower) ||
      lpo.notes?.toLowerCase().includes(searchLower) ||
      lpo.stockIntakePurchaseOrderItems.some((item) =>
        item.stockVariant.toLowerCase().includes(searchLower),
      )
    );
  });

  const handleQuantityChange = (
    lpoOrderNumber: string,
    itemId: string,
    value: string,
    maxQuantity: number,
    currentUnitCost: number,
  ) => {
    const numValue = parseInt(value) || 0;
    if (numValue > maxQuantity) {
      toast({
        title: "Quantity Exceeded",
        description: `Received quantity cannot exceed ordered quantity of ${maxQuantity}`,
        variant: "destructive",
      });
      return;
    }
    if (numValue < 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity cannot be negative",
        variant: "destructive",
      });
      return;
    }
    setReceivedQuantities((prev) => ({
      ...prev,
      [lpoOrderNumber]: {
        ...prev[lpoOrderNumber],
        [itemId]: { quantity: numValue, unitCost: currentUnitCost },
      },
    }));
  };

  const handleUnitCostChange = (
    lpoOrderNumber: string,
    itemId: string,
    value: string,
    currentQuantity: number,
  ) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0) {
      toast({
        title: "Invalid Cost",
        description: "Unit cost cannot be negative",
        variant: "destructive",
      });
      return;
    }
    setReceivedQuantities((prev) => ({
      ...prev,
      [lpoOrderNumber]: {
        ...prev[lpoOrderNumber],
        [itemId]: { quantity: currentQuantity, unitCost: numValue },
      },
    }));
  };

  const isLPOComplete = (lpo: StockPurchase) => {
    const quantities = receivedQuantities[lpo.orderNumber] || {};
    return lpo.stockIntakePurchaseOrderItems.every(
      (item) =>
        quantities[item.id] &&
        typeof quantities[item.id].quantity === "number" &&
        quantities[item.id].quantity >= 0,
    );
  };

  const hasAnyQuantity = (lpo: StockPurchase) => {
    const quantities = receivedQuantities[lpo.orderNumber] || {};
    return lpo.stockIntakePurchaseOrderItems.some(
      (item) =>
        quantities[item.id] && typeof quantities[item.id].quantity === "number",
    );
  };

  const getTotalReceived = (lpo: StockPurchase) => {
    const quantities = receivedQuantities[lpo.orderNumber] || {};
    return Object.values(quantities).reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  };

  const getItemsWithQuantityCount = (lpo: StockPurchase) => {
    const quantities = receivedQuantities[lpo.orderNumber] || {};
    return lpo.stockIntakePurchaseOrderItems.filter(
      (item) =>
        quantities[item.id] && typeof quantities[item.id].quantity === "number",
    ).length;
  };

  const calculateTotalCost = (lpoOrderNumber: string) => {
    const quantities = receivedQuantities[lpoOrderNumber] || {};
    return Object.values(quantities).reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );
  };

  const handleOpenReceiptDialog = (lpoOrderNumber: string) => {
    const selectedLPOData = lpos.find(
      (lpo) => lpo.orderNumber === lpoOrderNumber,
    );
    if (!selectedLPOData) {
      toast({
        title: "Error",
        description: "Purchase order not found",
        variant: "destructive",
      });
      return;
    }
    if (!isLPOComplete(selectedLPOData)) {
      const filledCount = getItemsWithQuantityCount(selectedLPOData);
      const totalCount = selectedLPOData.stockIntakePurchaseOrderItems.length;
      toast({
        title: "Incomplete Quantities",
        description: `Please fill in received quantities for all items before submitting. (${filledCount}/${totalCount} items filled)`,
        variant: "destructive",
      });
      return;
    }
    const quantities = receivedQuantities[lpoOrderNumber] || {};
    const allZero = selectedLPOData.stockIntakePurchaseOrderItems.every(
      (item) => quantities[item.id]?.quantity === 0,
    );
    if (allZero) {
      const confirmed = window.confirm(
        "All received quantities are set to 0. Are you sure you want to continue?",
      );
      if (!confirmed) return;
    }
    setSelectedLPO(lpoOrderNumber);
    setReceiptData({
      lpoId: selectedLPOData.id,
      lpoOrderNumber,
      staffId: "",
      receivedAt: getLocalDateTimeForInput(),
      notes: "",
    });
    setShowReceiptDialog(true);
  };

  const handleFinalSubmit = async () => {
    if (!selectedLPO) {
      toast({
        title: "Error",
        description: "No purchase order selected",
        variant: "destructive",
      });
      return;
    }
    if (!receiptData.staffId) {
      toast({
        title: "Missing Information",
        description: "Please select a staff member before submitting.",
        variant: "destructive",
      });
      return;
    }
    const selectedLPOData = lpos.find((lpo) => lpo.orderNumber === selectedLPO);
    if (!selectedLPOData) {
      toast({
        title: "Error",
        description: "Purchase order not found",
        variant: "destructive",
      });
      return;
    }

    const notesRequired = isNotesRequired(selectedLPO);
    if (notesRequired && !receiptData.notes.trim()) {
      toast({
        title: "Notes Required",
        description:
          "Please provide a reason since some items were received in quantities less than ordered.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(selectedLPO);
      const quantities = receivedQuantities[selectedLPO] || {};
      const receivedAtISO = localToUTCISO(receiptData.receivedAt);

      const payload = {
        staff: receiptData.staffId,
        receivedAt: receivedAtISO,
        notes: receiptData.notes || null,
        receivedItems: selectedLPOData.stockIntakePurchaseOrderItems.map(
          (item) => {
            const itemData = quantities[item.id] || {
              quantity: 0,
              unitCost: 0,
            };
            return {
              stockIntakePurchaseOrderItem: item.id,
              quantityReceived: itemData.quantity,
              totalCost: itemData.quantity * itemData.unitCost,
            };
          },
        ),
      };

      stockIntakeReceiptSchema.parse(payload);
      // console.log("Validated Payload:", validatedPayload);

      await receivePurchaseOrderAsStockIntake(
        {
          purchaseOrderId: receiptData.lpoId,
          items: selectedLPOData.stockIntakePurchaseOrderItems.map((item) => {
            const itemData = quantities[item.id] || {
              quantity: 0,
              unitCost: 0,
            };
            return {
              itemId: item.id,
              receivedQuantity: itemData.quantity,
              unitCost: itemData.unitCost,
            };
          }),
          notes: receiptData.notes || null,
        },
        receiptData.staffId,
        receivedAtISO,
      );

      toast({
        title: "Success",
        description: `Stock intake for ${selectedLPO} recorded successfully.`,
      });
      setShowReceiptDialog(false);
      setSelectedLPO(null);
      setReceivedQuantities({});
      router.push("/stock-intakes");
    } catch (error) {
      console.error("Submission error:", error);
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        toast({
          title: "Validation Error",
          description: errorMessages,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to record stock intake. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* ── Header: search + count ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by order, supplier, or item…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <p className="text-sm text-muted-foreground shrink-0">
          {filteredLPOs.length} of {lpos.length} order(s)
        </p>
      </div>

      {/* ── LPO grid: 1 col → 2 col on lg ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredLPOs.length > 0 ? (
          filteredLPOs.map((lpo) => {
            const totalQuantity = lpo.stockIntakePurchaseOrderItems.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            const isComplete = isLPOComplete(lpo);
            const hasQuantities = hasAnyQuantity(lpo);
            const submittingThis = isSubmitting === lpo.orderNumber;
            const filledCount = getItemsWithQuantityCount(lpo);
            const totalItems = lpo.stockIntakePurchaseOrderItems.length;

            return (
              <Card
                key={lpo.orderNumber}
                className={`flex flex-col transition-all hover:shadow-md ${
                  hasQuantities && !isComplete
                    ? "border-amber-500"
                    : isComplete
                      ? "border-green-500"
                      : ""
                }`}
              >
                <CardHeader className="pb-3 space-y-3">
                  {/* Order number + status badge */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <CardTitle className="text-sm sm:text-base truncate">
                        {lpo.orderNumber}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {lpo.status}
                    </Badge>
                  </div>

                  {/* Supplier block */}
                  <div className="rounded-md border bg-muted/30 px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {lpo.supplierName}
                      </span>
                    </div>
                    {(lpo.supplierPhoneNumber || lpo.supplierEmail) && (
                      <div className="flex flex-col xs:flex-row flex-wrap gap-x-4 gap-y-1">
                        {lpo.supplierPhoneNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{lpo.supplierPhoneNumber}</span>
                          </div>
                        )}
                        {lpo.supplierEmail && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {lpo.supplierEmail}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 pt-0">
                  {/* Progress bar */}
                  {hasQuantities && !isComplete && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>
                          {filledCount}/{totalItems} items
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(filledCount / totalItems) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats grid: 2×2 on all sizes */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      {
                        icon: Calendar,
                        label: "Delivery",
                        value: format(new Date(lpo.deliveryDate), "MMM dd"),
                      },
                      { icon: Hash, label: "Items", value: totalItems },
                      { icon: Package, label: "Ordered", value: totalQuantity },
                      {
                        icon: Package,
                        label: "Received",
                        value: getTotalReceived(lpo),
                      },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs">{label}</span>
                        </div>
                        <p className="font-medium text-sm">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Incomplete warning */}
                  {hasQuantities && !isComplete && (
                    <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-2 rounded-md text-xs">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Fill quantities for all items (0 is allowed)</span>
                    </div>
                  )}

                  <Separator />

                  {/* Items list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Items</p>
                      {isComplete && (
                        <Badge
                          variant="default"
                          className="bg-green-600 text-xs"
                        >
                          Ready
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 -mr-1">
                      {lpo.stockIntakePurchaseOrderItems.map((item) => {
                        const itemData =
                          receivedQuantities[lpo.orderNumber]?.[item.id];
                        const hasQuantity =
                          itemData && typeof itemData.quantity === "number";
                        const receivedQty = itemData?.quantity || 0;
                        const exceedsOrdered = receivedQty > item.quantity;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between gap-2 p-2 rounded-md ${
                              hasQuantity ? "bg-muted/40" : "hover:bg-muted/30"
                            }`}
                          >
                            {/* Item name + ordered qty */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate leading-tight">
                                {item.stockVariantName}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                Ordered: {item.quantity}
                              </span>
                            </div>

                            {/* Qty input — larger touch target on mobile */}
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              max={item.quantity}
                              placeholder="0"
                              value={hasQuantity ? receivedQty : ""}
                              onChange={(e) =>
                                handleQuantityChange(
                                  lpo.orderNumber,
                                  item.id,
                                  e.target.value,
                                  item.quantity,
                                  item.unitCost || 0,
                                )
                              }
                              onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (value > item.quantity) {
                                  handleQuantityChange(
                                    lpo.orderNumber,
                                    item.id,
                                    item.quantity.toString(),
                                    item.quantity,
                                    item.unitCost || 0,
                                  );
                                }
                              }}
                              className={`w-16 sm:w-20 text-center h-8 text-xs shrink-0 ${
                                !hasQuantity
                                  ? "border-dashed"
                                  : receivedQty === 0
                                    ? "border-blue-300 bg-blue-50"
                                    : exceedsOrdered
                                      ? "border-red-500 bg-red-50"
                                      : "border-green-500"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confirm Receipt CTA */}
                  <div className="pt-1">
                    <Button
                      onClick={() => handleOpenReceiptDialog(lpo.orderNumber)}
                      disabled={submittingThis || !isComplete}
                      size="default"
                      className={`w-full h-10 text-sm ${
                        isComplete ? "bg-green-600 hover:bg-green-700" : ""
                      }`}
                    >
                      {submittingThis ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Processing…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Confirm Receipt
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-16">
                <div className="text-center space-y-2">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="font-semibold">No purchase orders found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Receipt Confirmation Dialog ── */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        {/*
          On mobile: near-full-screen sheet feel (w-[95vw], no side padding).
          On sm+: standard centered modal.
          max-h with overflow-y-auto ensures it never clips on short screens.
        */}
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92dvh] overflow-y-auto p-4 sm:p-6 gap-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg">
              Confirm Stock Receipt
            </DialogTitle>
            <DialogDescription className="text-sm">
              Review and confirm receipt for{" "}
              <span className="font-semibold text-foreground">
                {selectedLPO}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Staff Selector */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                Staff Member <span className="text-red-500">*</span>
              </Label>
              <StaffSelectorWidget
                value={receiptData.staffId}
                onChange={(value) =>
                  setReceiptData((prev) => ({ ...prev, staffId: value }))
                }
                onBlur={() => {}}
                isRequired
                isDisabled={!!isSubmitting}
                label=""
                placeholder="Select staff member"
              />
            </div>

            {/* Date & Time */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                Receipt Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="datetime-local"
                  value={receiptData.receivedAt}
                  onChange={(e) =>
                    setReceiptData((prev) => ({
                      ...prev,
                      receivedAt: e.target.value,
                    }))
                  }
                  max={getMaxLocalDateTime()}
                  className="pl-9 h-10 text-sm"
                  disabled={!!isSubmitting}
                />
              </div>
            </div>

            <Separator />

            {/* Items & Costs review */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Items & Costs Review</Label>
                <Badge variant="outline" className="text-xs">
                  {selectedLPO &&
                    getItemsWithQuantityCount(
                      lpos.find((l) => l.orderNumber === selectedLPO)!,
                    )}{" "}
                  items
                </Badge>
              </div>

              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {selectedLPO &&
                  lpos
                    .find((lpo) => lpo.orderNumber === selectedLPO)
                    ?.stockIntakePurchaseOrderItems.map((item) => {
                      const itemData =
                        receivedQuantities[selectedLPO]?.[item.id];
                      const quantity = itemData?.quantity || 0;
                      const unitCost = itemData?.unitCost || item.unitCost || 0;
                      const totalCost = quantity * unitCost;

                      return (
                        <div key={item.id} className="p-3 space-y-2">
                          {/* Item name + total cost */}
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate leading-tight">
                                {item.stockVariantName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {quantity} × {unitCost.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">
                                Total
                              </p>
                              <p className="text-sm font-semibold">
                                {totalCost.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Unit cost input row — stacks nicely on all widths */}
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`unitCost-${item.id}`}
                              className="text-xs whitespace-nowrap shrink-0"
                            >
                              Unit Cost:
                            </Label>
                            <Input
                              id={`unitCost-${item.id}`}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              value={unitCost}
                              onChange={(e) =>
                                handleUnitCostChange(
                                  selectedLPO,
                                  item.id,
                                  e.target.value,
                                  quantity,
                                )
                              }
                              className="h-9 text-sm flex-1"
                              placeholder="0.00"
                              disabled={!!isSubmitting}
                            />
                          </div>
                        </div>
                      );
                    })}
              </div>

              {/* Total cost summary */}
              {selectedLPO && (
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Order Cost</p>
                      <p className="text-xs text-muted-foreground">
                        Based on received quantities
                      </p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold tabular-nums">
                      {calculateTotalCost(selectedLPO).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Notes */}
            {(() => {
              const notesRequired = selectedLPO
                ? isNotesRequired(selectedLPO)
                : false;
              return (
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    Notes{" "}
                    {notesRequired ? (
                      <span className="text-red-500">
                        * (required — partial receipt)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">(optional)</span>
                    )}
                  </Label>

                  {notesRequired && (
                    <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-2 rounded-md text-xs">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        Some items were received in smaller quantities than
                        ordered. Please describe the reason (e.g. damaged goods,
                        partial shipment, supplier shortage).
                      </span>
                    </div>
                  )}

                  <Textarea
                    value={receiptData.notes}
                    onChange={(e) =>
                      setReceiptData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder={
                      notesRequired
                        ? "Describe why quantities are less than ordered…"
                        : "Optional notes about this receipt…"
                    }
                    className={`min-h-[80px] resize-none text-sm ${
                      notesRequired && !receiptData.notes.trim()
                        ? "border-red-400 focus-visible:ring-red-400"
                        : ""
                    }`}
                    disabled={!!isSubmitting}
                  />

                  {notesRequired && !receiptData.notes.trim() && (
                    <p className="text-xs text-red-500">
                      Notes are required when quantities received are less than
                      ordered.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/*
            Footer: stacks vertically on mobile (Cancel below Submit) so
            the primary action is always easy to reach with a thumb.
            On sm+: side-by-side.
          */}
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowReceiptDialog(false);
                setSelectedLPO(null);
              }}
              disabled={!!isSubmitting}
              className="w-full sm:w-auto h-10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={!receiptData.staffId || !!isSubmitting}
              className="w-full sm:w-auto h-10 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Receipt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
