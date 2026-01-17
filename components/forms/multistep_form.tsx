"use client";

import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";
import BusinessForm from "./business_form";
import { createBusiness } from "@/lib/actions/business-actions";
import { createLocation } from "@/lib/actions/location-actions";
import { Business } from "@/types/business/type";
import { LocationForm } from "@/components/forms/location_form";

const MultiStepBusinessForm = ({
  item,
}: {
  item: Business | null | undefined;
}) => {
  const [step, setStep] = useState(1);
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(
    null,
  );
  const isNewItem = !item;

  const handleBusinessSubmit = async (data: any) => {
    console.log("Business Data:", data);

    if (!isNewItem) {
      setBusinessData(data as Business);
      return;
    }

    try {
      const savedBusiness = await createBusiness(data);

      console.log("Business data after successful saving data:", savedBusiness);

      if (savedBusiness?.responseType === "success" && savedBusiness.data) {
        const businessId = (savedBusiness.data as Business).id;
        setCreatedBusinessId(businessId);
        setBusinessData(savedBusiness.data as Business);

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
      // Pass the businessId as the second parameter
      const savedLocation = await createLocation(
        locationData,
        createdBusinessId,
      );

      if (savedLocation?.responseType === "success") {
        toast({
          title: "Setup complete!",
          description:
            "Business and location have been registered successfully.",
        });

        window.location.href = "/select-location";
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
  );
};

export default MultiStepBusinessForm;
