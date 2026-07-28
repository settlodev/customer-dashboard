"use client";

import {
  ApproveStockRequest,
  CancelStockRequest,
} from "@/lib/actions/warehouse/request-actions";
import { UUID } from "crypto";
import React, { useState } from "react";
import {
  Package,
  MapPin,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import WarehouseStaffSelectorWidget from "@/components/widgets/warehouse/staff-selector";
import { FormResponse } from "@/types/types";
import { StockRequests } from "@/types/warehouse/purchase/request/type";
import { cn } from "@/lib/utils";

type Params = Promise<{ id: string }>;

interface StockRequestPageProps {
  params: Params;
  initialRequest: any;
}

const formatDate = (value: unknown): string => {
  if (!value) return "-";
  const formatted = new Date(value as string).toLocaleString();
  return formatted === "Invalid Date" ? "-" : formatted;
};

const getInitials = (name: string): string => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    APPROVED: {
      label: "Approved",
      className: "bg-green-50 text-green-700 border border-green-200",
    },
    PENDING: {
      label: "Pending",
      className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    },
    REQUESTED: {
      label: "Requested",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-red-50 text-red-700 border border-red-200",
    },
  };

  const { label, className } = config[status?.toUpperCase()] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  };

  return (
    <span
      className={cn("text-xs font-medium px-3 py-1.5 rounded-full", className)}
    >
      {label}
    </span>
  );
};

const Avatar = ({
  name,
  variant = "blue",
}: {
  name: string;
  variant?: "blue" | "green";
}) => {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
        styles[variant],
      )}
    >
      {getInitials(name)}
    </div>
  );
};

const SectionCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon?: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
    {title && (
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {title}
      </p>
    )}
    {children}
  </div>
);

const RequestStockPage = ({ initialRequest }: StockRequestPageProps) => {
  const [request, setRequest] = useState(initialRequest);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "cancel" | null>(
    null,
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = () => {
    setModalAction("approve");
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setModalAction("cancel");
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalAction(null);
    setSelectedStaffId("");
  };

  const handleSubmit = async () => {
    if (!selectedStaffId) {
      toast({
        title: "Error",
        description: "Please select a staff member",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const warehouseStaffApproved = selectedStaffId as UUID;
      let response: FormResponse<StockRequests>;

      if (modalAction === "approve") {
        response = await ApproveStockRequest(
          request.id,
          warehouseStaffApproved,
        );
      } else if (modalAction === "cancel") {
        response = await CancelStockRequest(request.id, warehouseStaffApproved);
      } else {
        throw new Error("Invalid action");
      }

      if (response.responseType === "error") {
        throw response.error || new Error(response.message);
      }

      toast({
        variant: "success",
        title: "Success",
        description: response.message,
      });
      if (response.data) setRequest(response.data);

      handleModalClose();
      setTimeout(() => {
        window.location.href = "/warehouse-requests";
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      handleModalClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = request.requestStatus?.toUpperCase();
  const canApprove = status === "PENDING" || status === "REQUESTED";
  const canCancel =
    status === "PENDING" || status === "REQUESTED" || status === "APPROVED";
  const isTerminal = status === "APPROVED" || status === "CANCELLED";

  return (
    <div className="min-h-screen py-8 mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Stock Request</p>
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">
              Request Details
            </h1>
          </div>
          <StatusBadge status={request.requestStatus} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stock Info */}
            <SectionCard icon={Package} title="Stock information">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Stock name</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {request.warehouseStockName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Variant</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {request.warehouseStockVariantName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    Quantity requested
                  </p>
                  <p className="text-3xl font-medium text-blue-600 leading-none">
                    {request.quantity}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Transfer Route */}
            <SectionCard icon={MapPin} title="Transfer route">
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex-1 text-center">
                  <p className="text-xs text-gray-400 mb-1">From location</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.fromLocationName}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex-1 text-center">
                  <p className="text-xs text-gray-400 mb-1">To warehouse</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.toWarehouseName}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Comment */}
            {request.comment && (
              <SectionCard icon={MessageSquare} title="Comment">
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border-l-2 border-gray-300 dark:border-gray-600 leading-relaxed">
                  {request.comment}
                </p>
              </SectionCard>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Actions */}
            <SectionCard title="Actions">
              {isTerminal ? (
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    status === "APPROVED" ? "text-green-600" : "text-red-600",
                  )}
                >
                  {status === "APPROVED" ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Request approved
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Request cancelled
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {canApprove && (
                    <button
                      onClick={handleApprove}
                      className="w-full py-2 px-4 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve request
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={handleCancel}
                      className="w-full py-2 px-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel request
                    </button>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Staff */}
            <SectionCard icon={User} title="Staff">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={request.locationStaffRequestedName}
                    variant="blue"
                  />
                  <div>
                    <p className="text-xs text-gray-400">Requested by</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {request.locationStaffRequestedName || "-"}
                    </p>
                  </div>
                </div>
                {request.warehouseStaffApprovedName && (
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={request.warehouseStaffApprovedName}
                      variant="green"
                    />
                    <div>
                      <p className="text-xs text-gray-400">
                        {status === "CANCELLED"
                          ? "Cancelled by"
                          : "Approved by"}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.warehouseStaffApprovedName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Timeline */}
            <SectionCard icon={Calendar} title="Timeline">
              <div className="space-y-2.5">
                <div className="flex justify-between items-baseline">
                  <p className="text-xs text-gray-400">Requested</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {formatDate(request.requestedDate)}
                  </p>
                </div>
                {request.approvedDate && (
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-gray-400">Approved</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {formatDate(request.approvedDate)}
                    </p>
                  </div>
                )}
                {request.cancelledDate && (
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-gray-400">Cancelled</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {formatDate(request.cancelledDate)}
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalAction === "approve"
                ? "Approve stock request"
                : "Cancel stock request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select staff member
              </label>
              <WarehouseStaffSelectorWidget
                label="Staff member"
                placeholder="Select staff member"
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                onBlur={() => {}}
              />
            </div>
            <p className="text-sm text-gray-500">
              {modalAction === "approve"
                ? "This staff member will be recorded as the approver of this request."
                : "This staff member will be recorded as the canceller of this request."}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleModalClose}
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedStaffId}
              variant={modalAction === "cancel" ? "destructive" : "default"}
              className={
                modalAction === "approve"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : modalAction === "approve" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestStockPage;
