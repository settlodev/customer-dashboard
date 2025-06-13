'use client';

import { Loader2, CheckCircle2, XCircle, CreditCard } from "lucide-react";

interface PaymentStatusModalProps {
  isOpen: boolean;
  status?: "INITIATING" | "PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null;
  onClose: () => void;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({ isOpen, status, onClose }) => {
  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case "INITIATING":
        return {
          message: "Initiating payment...",
          description: "Please wait while we prepare your payment",
          icon: <CreditCard className="w-8 h-8 text-blue-500 animate-pulse" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
      case "PENDING":
        return {
          message: "Awaiting payment confirmation...",
          description: "Please complete the payment on your device",
          icon: <Loader2 className="w-8 h-8 animate-spin text-blue-500" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
      case "PROCESSING":
        return {
          message: "Processing payment...",
          description: "Your payment is being verified",
          icon: <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200"
        };
      case "SUCCESS":
        return {
          message: "Payment successful!",
          description: "Your subscription has been updated",
          icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200"
        };
      case "FAILED":
        return {
          message: "Payment failed",
          description: "Please try again or contact support",
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        };
      default:
        return {
          message: "Processing...",
          description: "",
          icon: <Loader2 className="w-8 h-8 animate-spin text-gray-500" />,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200"
        };
    }
  };

  const { message, description, icon, bgColor, borderColor } = getStatusContent();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className={`bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full mx-4 border-2 ${borderColor}`}>
        <div className={`${bgColor} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6`}>
          {icon}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">{message}</h3>
        {description && (
          <p className="text-gray-600 mb-6">{description}</p>
        )}

        {/* Progress indicator for processing states */}
        {(status === "INITIATING" || status === "PENDING" || status === "PROCESSING") && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse" 
                 style={{ 
                   width: status === "INITIATING" ? "25%" : 
                          status === "PENDING" ? "50%" : "75%" 
                 }}>
            </div>
          </div>
        )}

        {(status === "SUCCESS" || status === "FAILED") && (
          <button 
            onClick={onClose} 
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              status === "SUCCESS" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {status === "SUCCESS" ? "Continue" : "Try Again"}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusModal;
