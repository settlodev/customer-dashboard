'use client';

import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface PaymentStatusModalProps {
  isOpen: boolean;
  status?: "PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null;
  onClose: () => void;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({ isOpen, status, onClose }) => {
  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case "PENDING":
        return {
          message: "Subscription created, awaiting payment confirmation",
          icon: <Loader2 className="w-8 h-8 animate-spin text-blue-500" />,
        };
      case "PROCESSING":
        return {
          message: "Still processing payment...",
          icon: <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />,
        };
      case "SUCCESS":
        return {
          message: "Payment successful!",
          icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
        };
      case "FAILED":
        return {
          message: "Payment failed. Please try again.",
          icon: <XCircle className="w-8 h-8 text-red-500" />,
        };
      default:
        return {
          message: "",
          icon: null,
        };
    }
  };

  const { message, icon } = getStatusContent();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <div className="flex flex-col items-center space-y-4">
          {icon}
          <p className="text-lg font-semibold">{message}</p>

          {(status === "SUCCESS" || status === "FAILED") && (
            <button onClick={onClose} className="bg-gray-900 text-white px-4 py-2 rounded">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusModal;
