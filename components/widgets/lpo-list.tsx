"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Truck,
  Phone,
  Mail,
  Hash,
  Clock,
  DollarSign,
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
}

export function LPOSelectionList({ lpos }: LPOSelectionListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [receivedQuantities, setReceivedQuantities] =
    useState<ReceivedQuantities>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Dialog state
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedLPO, setSelectedLPO] = useState<string | null>(null);

  // Helper function to get current local time in datetime-local format
  const getLocalDateTimeForInput = () => {
    const now = new Date();
    // Get local time components (browser automatically uses local timezone)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to get max datetime in local format for validation
  const getMaxLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert local datetime string to UTC ISO string
  const localToUTCISO = (localDateTimeString: string) => {
    // Create date from local string (browser interprets as local time)
    const localDate = new Date(localDateTimeString);
    // Convert to UTC ISO string
    return localDate.toISOString();
  };

  // Format date for display in dialog (shows what will be submitted)
  const formatForDisplay = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return format(date, "dd/MM/yyyy, HH:mm");
  };

  const [receiptData, setReceiptData] = useState<ReceiptDialogData>({
    lpoId: "",
    lpoOrderNumber: "",
    staffId: "",
    receivedAt: getLocalDateTimeForInput(),
  });

  // Filter LPOs based on search query
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

  // Handle quantity input change with validation
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
        [itemId]: {
          quantity: numValue,
          unitCost: currentUnitCost,
        },
      },
    }));
  };

  // Handle unit cost change
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
        [itemId]: {
          quantity: currentQuantity,
          unitCost: numValue,
        },
      },
    }));
  };

  // Check if LPO has all quantities filled (including 0)
  const isLPOComplete = (lpo: StockPurchase) => {
    const quantities = receivedQuantities[lpo.orderNumber] || {};
    return lpo.stockIntakePurchaseOrderItems.every(
      (item) =>
        quantities[item.id] &&
        typeof quantities[item.id].quantity === "number" &&
        quantities[item.id].quantity >= 0,
    );
  };

  // Check if LPO has any quantities filled (including 0)
  const hasAnyQuantity = (lpo: StockPurchase) => {
    const quantities = receivedQuantities[lpo.orderNumber] || {};
    return lpo.stockIntakePurchaseOrderItems.some(
      (item) =>
        quantities[item.id] && typeof quantities[item.id].quantity === "number",
    );
  };

  // Get total received quantity for an LPO (includes 0 values)
  const getTotalReceived = (lpo: StockPurchase) => {
    const quantities = receivedQuantities[lpo.orderNumber] || {};
    return Object.values(quantities).reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  };

  // Count how many items have received quantities (including 0)
  const getItemsWithQuantityCount = (lpo: StockPurchase) => {
    const quantities = receivedQuantities[lpo.orderNumber] || {};
    return lpo.stockIntakePurchaseOrderItems.filter(
      (item) =>
        quantities[item.id] && typeof quantities[item.id].quantity === "number",
    ).length;
  };

  // Calculate total cost for dialog
  const calculateTotalCost = (lpoOrderNumber: string) => {
    const quantities = receivedQuantities[lpoOrderNumber] || {};
    return Object.values(quantities).reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );
  };

  // Open receipt dialog
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

    // Validate all items have received quantities (can be 0)
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

    // Check if all quantities are 0
    const quantities = receivedQuantities[lpoOrderNumber] || {};
    const allZero = selectedLPOData.stockIntakePurchaseOrderItems.every(
      (item) => quantities[item.id]?.quantity === 0,
    );

    if (allZero) {
      const confirmed = window.confirm(
        "All received quantities are set to 0. Are you sure you want to continue?",
      );

      if (!confirmed) {
        return;
      }
    }

    // Set dialog data and open - USE LOCAL TIME, not UTC!
    setSelectedLPO(lpoOrderNumber);
    setReceiptData({
      lpoId: selectedLPOData.id,
      lpoOrderNumber,
      staffId: "",
      receivedAt: getLocalDateTimeForInput(), // FIXED: Use local time function
    });
    setShowReceiptDialog(true);
  };

  // Handle final submission with Zod validation
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

    try {
      setIsSubmitting(selectedLPO);

      const quantities = receivedQuantities[selectedLPO] || {};

      // Convert the datetime-local value (in local time) to UTC ISO string
      const receivedAtISO = localToUTCISO(receiptData.receivedAt);

      console.log("Local time input:", receiptData.receivedAt);
      console.log("Converted to UTC:", receivedAtISO);

      // Prepare the payload in the exact format expected by the API
      const payload = {
        staff: receiptData.staffId,
        receivedAt: receivedAtISO,
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

      // Validate payload with Zod schema
      const validatedPayload = stockIntakeReceiptSchema.parse(payload);

      console.log("Validated Payload:", validatedPayload);

      // Call the API function with receivedAt parameter
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
        },
        receiptData.staffId,
        receivedAtISO,
      );

      toast({
        title: "Success",
        description: `Stock intake for ${selectedLPO} recorded successfully.`,
      });

      // Close dialog and redirect
      setShowReceiptDialog(false);
      setSelectedLPO(null);
      setReceivedQuantities({});
      router.push("/stock-intakes");
    } catch (error) {
      console.error("Submission error:", error);

      // Handle Zod validation errors
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
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, supplier, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLPOs.length} of {lpos.length} purchase order(s)
      </div>

      {/* LPO List in 2-column grid */}
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
                className={`transition-all hover:shadow-sm h-full flex flex-col ${
                  hasQuantities && !isComplete
                    ? "border-amber-500"
                    : isComplete
                      ? "border-green-500"
                      : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base truncate">
                          {lpo.orderNumber}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {lpo.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <Truck className="h-3 w-3" />
                      <span className="truncate">{lpo.supplierName}</span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 flex-1">
                  {/* Progress indicator */}
                  {hasQuantities && !isComplete && (
                    <div className="mb-2">
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

                  {/* Compact Order Details in 2 columns */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Delivery</span>
                      </div>
                      <p className="font-medium truncate">
                        {format(new Date(lpo.deliveryDate), "MMM dd")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <span>Items</span>
                      </div>
                      <p className="font-medium">{totalItems}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        <span>Ordered</span>
                      </div>
                      <p className="font-medium">{totalQuantity}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        <span>Received</span>
                      </div>
                      <p className="font-medium">{getTotalReceived(lpo)}</p>
                    </div>
                  </div>

                  {/* Warning message for incomplete quantities */}
                  {hasQuantities && !isComplete && (
                    <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-2 rounded-md text-xs">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <span>Fill quantities for all items (0 is allowed)</span>
                    </div>
                  )}

                  <Separator />

                  {/* Compact Items List */}
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
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
                            className={`flex items-center justify-between gap-2 p-1.5 rounded ${
                              hasQuantity ? "bg-muted/30" : "hover:bg-muted/30"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {item.stockVariantName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">
                                  Ordered: {item.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
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
                                className={`w-20 text-center h-7 text-xs ${
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
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Compact Contact Information */}
                  {(lpo.supplierPhoneNumber || lpo.supplierEmail) && (
                    <>
                      <Separator />
                      <div className="space-y-1.5 text-xs">
                        <p className="font-medium">Contact:</p>
                        <div className="space-y-1">
                          {lpo.supplierPhoneNumber && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span className="truncate">
                                {lpo.supplierPhoneNumber}
                              </span>
                            </div>
                          )}
                          {lpo.supplierEmail && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">
                                {lpo.supplierEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Compact Notes */}
                  {lpo.notes && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium">Notes:</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {lpo.notes}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Confirm Button at Bottom */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleOpenReceiptDialog(lpo.orderNumber)}
                      disabled={submittingThis || !isComplete}
                      size="sm"
                      className={`w-full ${
                        isComplete ? "bg-green-600 hover:bg-green-700" : ""
                      }`}
                    >
                      {submittingThis ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
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
          <div className="col-span-1 lg:col-span-2">
            <Card>
              <CardContent className="py-12">
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

      {/* Receipt Confirmation Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Stock Receipt</DialogTitle>
            <DialogDescription>
              Review and confirm the receipt details for purchase order{" "}
              <span className="font-semibold">{selectedLPO}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Staff Selector */}
            <div className="space-y-2">
              <Label htmlFor="staff">
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

            {/* Date Time Picker */}
            <div className="space-y-2">
              <Label htmlFor="receivedAt">
                Receipt Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="receivedAt"
                  type="datetime-local"
                  value={receiptData.receivedAt}
                  onChange={(e) =>
                    setReceiptData((prev) => ({
                      ...prev,
                      receivedAt: e.target.value,
                    }))
                  }
                  max={getMaxLocalDateTime()} // Use local time max
                  className="pl-9"
                  disabled={!!isSubmitting}
                />
              </div>
            </div>

            <Separator />

            {/* Items Review with Unit Cost Inputs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items & Costs Review</Label>
                <Badge variant="outline" className="text-xs">
                  {selectedLPO &&
                    getItemsWithQuantityCount(
                      lpos.find((lpo) => lpo.orderNumber === selectedLPO)!,
                    )}{" "}
                  items
                </Badge>
              </div>

              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {item.stockVariantName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {quantity} × {unitCost.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  Total
                                </p>
                                <p className="text-sm font-semibold">
                                  {totalCost.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Unit Cost Input */}
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`unitCost-{item.id}`}
                              className="text-xs min-w-fit"
                            >
                              Unit Cost:
                            </Label>
                            <div className="flex-1">
                              <Input
                                id={`unitCost-{item.id}`}
                                type="number"
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
                                className="pl-6 h-8 text-xs"
                                placeholder="0.00"
                                disabled={!!isSubmitting}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>

              {/* Total Cost Summary */}
              {selectedLPO && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Total Order Cost</p>
                      <p className="text-xs text-muted-foreground">
                        Based on received quantities
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {calculateTotalCost(selectedLPO).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowReceiptDialog(false);
                setSelectedLPO(null);
              }}
              disabled={!!isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={!receiptData.staffId || !!isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
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
