


  'use client';

import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import BusinessForm from './business_form';
import LocationForm from './location_form';
import { createBusiness } from '@/lib/actions/business-actions';
import { createLocation } from '@/lib/actions/location-actions';
import { Business } from '@/types/business/type';

const MultiStepBusinessForm = ({ item }: { item: Business | null | undefined }) => {
  console.log("item: ", item);
  const [step, setStep] = useState(1);
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const isNewItem = !item;
  
  const handleBusinessSubmit = async (data: any) => {
    console.log("Business Data:", data);
    setBusinessData(data as Business);

    if (!isNewItem) {
      await handleLocationSubmit({});
      return;
    }

    setStep(2);
    toast({
      title: "Business information saved",
      description: "Please complete location information to finish setup",
    });
  };

  const handleLocationSubmit = async (locationData: any) => {
    let savedBusiness;
    try {
      // First submit business data
      if (businessData) {
        savedBusiness = await createBusiness(businessData);
        // console.log("Saved Business:", savedBusiness );
      }
      
      if (savedBusiness) {
        // Then submit location data with the new business ID
        const businessId = (savedBusiness as unknown as Business).id; 
        const locationPayload = {
          ...locationData,
          business: businessId
        };

        console.log("Location with Business ID:", locationPayload);
        
        // Changed to use the imported function directly instead of passing a second parameter
        const savedLocation = await createLocation(locationPayload);
        
        if (savedLocation) {
          toast({
            title: "Setup complete!",
            description: "Business and location have been registered successfully.",
          });
        }
      }
    } catch (error) {
      console.error("Error saving business or location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem setting up your business. Please try again.",
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
            submitButtonText={isNewItem ? "Continue to Location Setup" : "Update Business"}
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
          />
        </div>
      )}
      
      {isNewItem && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          </div>
          <p className="text-sm text-gray-500">
            Step {step} of 2
          </p>      
        </div>
      )}
    </div>
  );
};

export default MultiStepBusinessForm;