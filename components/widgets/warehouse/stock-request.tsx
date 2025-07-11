'use client';

import { ApproveStockRequest, CancelStockRequest } from '@/lib/actions/warehouse/request-actions';
import { UUID } from 'crypto';
import React, { useState } from 'react';
import { Package, MapPin, User, Calendar, MessageSquare, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/widgets/warehouse/status-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import WarehouseStaffSelectorWidget from '@/components/widgets/warehouse/staff-selector';

type Params = Promise<{id: string}>

interface StockRequestPageProps {
  params: Params;
  initialRequest: any; // Replace with your actual request type
}

const RequestStockPage = ({ initialRequest }: StockRequestPageProps) => {
  const [request, setRequest] = useState(initialRequest);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'cancel' | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = () => {
    setModalAction('approve');
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setModalAction('cancel');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalAction(null);
    setSelectedStaffId('');
  };

  const handleSubmit = async () => {
    if (!selectedStaffId) {
      toast({
        title: "Error",
        description: "Please select a staff member",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let result;
      const warehouseStaffApproved = selectedStaffId as UUID;
      
      if (modalAction === 'approve') {
       
        result = await ApproveStockRequest(request.id,warehouseStaffApproved);
        toast({
          title: "Success",
          description: "Stock request approved successfully",
        });
      } else if (modalAction === 'cancel') {

        result = await CancelStockRequest(request.id,warehouseStaffApproved);
        toast({
          title: "Success",
          description: "Stock request cancelled successfully",
        });
      }

      if (result?.data) {
        setRequest(result.data);
      }
      
      handleModalClose();
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: `Failed to ${modalAction} request. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canApprove = request.warehouseStockRequestStatus === 'PENDING' || 
                    request.warehouseStockRequestStatus === 'REQUESTED';
  const canCancel = request.warehouseStockRequestStatus === 'PENDING' || 
                   request.warehouseStockRequestStatus === 'REQUESTED' || 
                   request.warehouseStockRequestStatus === 'APPROVED';

  return (
    <div className="min-h-screen bg-gray-50 py-8 mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900">Stock Request Details</h1>
            </div>
            <StatusBadge status={request.warehouseStockRequestStatus} />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Stock Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <p className="text-lg font-medium text-gray-900">{request.warehouseStockName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant</label>
                  <p className="text-gray-900">{request.warehouseStockVariantName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Requested</label>
                  <p className="text-2xl font-bold text-blue-600">{request.quantity} units</p>
                </div>
              </div>
            </div>

            {/* Location Transfer */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Request Details
              </h2>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">From</p>
                  <p className="text-lg font-medium text-gray-900">{request.fromLocationName}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-blue-500" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">To</p>
                  <p className="text-lg font-medium text-gray-900">{request.toWarehouseName}</p>
                </div>
              </div>
            </div>

            {/* Comment */}
            {request.comment && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comment
                </h2>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{request.comment}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {request.warehouseStockRequestStatus === 'APPROVED' ? (
                  <div className="flex items-center text-green-600 font-semibold">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Request Approved
                  </div>
                ) : request.warehouseStockRequestStatus === 'CANCELLED' ? (
                  <div className="flex items-center text-red-600 font-semibold">
                    <XCircle className="w-4 h-4 mr-2" />
                    Request Cancelled
                  </div>
                ) : (
                  <>
                    {canApprove && (
                      <Button
                        onClick={handleApprove}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Request
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        onClick={handleCancel}
                        variant="destructive"
                        className="w-full"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Request
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Staff Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Staff Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                  <p className="text-gray-900">{request.locationStaffRequestedName}</p>
                </div>
                {request.warehouseStaffApprovedName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
                    <p className="text-gray-900">{request.warehouseStaffApprovedName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Approval Dates
              </h2>
              <div className="space-y-3">
                {request.approvedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved Date</label>
                    <p className="text-gray-900">{new Date(request.approvedDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Staff Selection */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalAction === 'approve' ? 'Approve Stock Request' : 'Cancel Stock Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Staff Member
              </label>
              <WarehouseStaffSelectorWidget
                label="Staff Member"
                placeholder="Select staff member"
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                onBlur={() => {}}
              />
            </div>
            <div className="text-sm text-gray-600">
              {modalAction === 'approve' 
                ? 'This staff member will be recorded as the approver of this request.'
                : 'This staff member will be recorded as the canceller of this request.'}
            </div>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleModalClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedStaffId}
              className={modalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={modalAction === 'cancel' ? 'destructive' : 'default'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {modalAction === 'approve' ? (
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