"use client";

import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";
import BusinessForm from "@/components/forms/business_form";
import { createBusiness } from "@/lib/actions/business-actions";
import { createLocation } from "@/lib/actions/location-actions";
import { Business } from "@/types/business/type";
import { LocationForm } from "@/components/forms/location_form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const MultiStepBusinessForm = ({
  item,
  onCancel,
}: {
  item: Business | null | undefined;
  onCancel?: () => void;
}) => {
  const [step, setStep] = useState(1);
  const [, setBusinessData] = useState<Business | null>(null);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(
    null,
  );
  const [createdBusinessName, setCreatedBusinessName] = useState<string | null>(
    null,
  );
  const [createdLocationName, setCreatedLocationName] = useState<string | null>(
    null,
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isNewItem = !item;

  const handleBusinessSubmit = async (data: any) => {
    if (!isNewItem) {
      setBusinessData(data as Business);
      return;
    }

    try {
      const savedBusiness = await createBusiness(data);

      if (savedBusiness?.responseType === "success" && savedBusiness.data) {
        const business = savedBusiness.data as Business;
        setCreatedBusinessId(business.id);
        setCreatedBusinessName(business.name);
        setBusinessData(business);
        setStep(2);
        toast({
          title: "Business created successfully",
          description: "Please complete location information to finish setup",
        });
      } else {
        throw new Error("Failed to create business");
      }
    } catch (error) {
      console.error("Error creating business:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "There was a problem creating your business. Please try again.",
      });
    }
  };

  const handleLocationSubmit = async (locationData: any) => {
    if (!createdBusinessId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Business ID not found. Please try again.",
      });
      return;
    }

    try {
      const savedLocation = await createLocation(
        locationData,
        createdBusinessId,
      );

      if (savedLocation?.responseType === "success" && savedLocation.data) {
        setCreatedLocationName((savedLocation.data as any).name);
        setShowSuccessModal(true);
      } else {
        throw new Error(savedLocation?.message || "Failed to create location");
      }
    } catch (error) {
      console.error("Error creating location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "There was a problem creating the location. Please try again.",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {isNewItem && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
              )}
              <h2 className="text-lg font-semibold">Business Information</h2>
            </div>
            <BusinessForm
              item={item}
              onSubmit={handleBusinessSubmit}
              submitButtonText={
                isNewItem ? "Continue to Location Setup" : "Update Business"
              }
            />
          </div>
        )}

        {step === 2 && isNewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <h2 className="text-lg font-semibold">Location Information</h2>
            </div>
            <LocationForm
              item={null}
              onSubmit={handleLocationSubmit}
              multipleStep={true}
              businessId={createdBusinessId}
            />
          </div>
        )}

        {isNewItem && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-200"}`}
              />
              <div
                className={`h-2 w-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
              />
            </div>
            <p className="text-sm text-gray-500">Step {step} of 2</p>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          // Prevent closing by clicking outside or pressing Escape
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <DialogTitle className="text-center text-xl">
              Setup Complete!
            </DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-semibold text-foreground">
                {createdBusinessName}
              </span>{" "}
              has been successfully created with location{" "}
              <span className="font-semibold text-foreground">
                {createdLocationName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowSuccessModal(false);
                onCancel?.();
              }}
            >
              Stay on Page
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                window.location.href = "/select-business";
              }}
            >
              Go to Select Business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MultiStepBusinessForm;
