import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { Button } from "@/components/ui/button";
import { StockIntake } from "@/types/stock-intake/type";

interface ItemModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  data: StockIntake;
}

export default function ItemModal({
  isOpen,
  onOpenChange,
  data
}: ItemModalProps) {
  const formatQuantity = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format;

  const formatValue = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "TZS",
  }).format;

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(dateString));

  return (
    <>
      <Modal
        backdrop="blur"
        className="w-1/4 p-4 rounded-2xl border-t-gray-300"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        placement="center"
        radius="sm"
        size="lg"
        onOpenChange={onOpenChange}
        style={{ background: '#FAFAFA' }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 mt-3">
                Stock Intake Details
              </ModalHeader>
              <ModalBody>
                <div><strong>Stock Variant:</strong> {data.stockVariantName}</div>
                <div><strong>Quantity:</strong> {formatQuantity(data.quantity)}</div>
                <div><strong>Value:</strong> {formatValue(data.value)}</div>
                <div><strong>Order Date:</strong> {formatDate(data.orderDate)}</div>
                <div><strong>Delivery Date:</strong> {formatDate(data.deliveryDate)}</div>
                <div><strong>Batch Expiry Date:</strong> {formatDate(data.batchExpiryDate)}</div>
                <div><strong>Supplier:</strong> {data.supplierName}</div>
                <div><strong>Staff:</strong> {data.staffName}</div>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
