"use client";

import { Input } from "@/components/ui/input";
import { FieldErrors, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { FormError } from "@/components/widgets/form-error";
import { FormSuccess } from "@/components/widgets/form-success";
import CancelButton from "@/components/widgets/cancel-button";
import SubmitButton from "@/components/widgets/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Edit2, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initiateTanQr } from "@/lib/actions/mhb";
import { Location } from "@/types/location/type";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

const TanqrSchema = z.object({
  merchantName: z
    .string()
    .min(1, "Merchant name is required")
    .min(2, "Merchant name must be at least 2 characters")
    .max(100, "Merchant name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-&.'()]+$/, "Invalid characters in merchant name"),
  emailAddress: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email address is required"),
  phoneNumber: z
    .string()
    .optional()
    .or(z.string().length(0))
    .or(z.string().min(10, "Phone number must be at least 10 digits")),
  businessType: z
    .string()
    .optional()
    .or(z.string().min(1, "Please select a business type")),
});

type TanqrFormData = z.infer<typeof TanqrSchema>;

function RequestTanqrForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [location, setLocation] = useState<Location>();
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<TanqrFormData>({
    resolver: zodResolver(TanqrSchema),
    defaultValues: {
      merchantName: "",
      emailAddress: "",
      phoneNumber: "",
      businessType: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchLocation = async () => {
      setIsLoadingLocation(true);
      try {
        const currentLocation = await getCurrentLocation();
        console.log("The current location is", currentLocation);
        setLocation(currentLocation);

        // Pre-fill form with location data
        if (currentLocation) {
          form.reset({
            merchantName: currentLocation.name || "",
            emailAddress: currentLocation.email || "",
            phoneNumber: currentLocation.phone || "",
            businessType: currentLocation.locationBusinessTypeName || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch location:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load business details. Please try again.",
        });
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocation();
  }, [form, toast]);

  const handleFormChange = useCallback(() => {
    if (error) setError("");
    if (success) setSuccess("");
  }, [error, success]);

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Form errors:", errors);
      const firstError = Object.values(errors)[0]?.message;

      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          typeof firstError === "string"
            ? firstError
            : "Please check the form for errors",
      });
    },
    [toast],
  );

  const requestTanQr = async (formData: TanqrFormData) => {
    try {
      setError("");
      setSuccess("");

      const response = await initiateTanQr(formData);

      // Check if the response indicates an error
      if (response.responseType === "error") {
        throw new Error(response.message);
      }

      // If we get here, the request was successful
      setSuccess("TANQR request submitted successfully!");
      setIsEditMode(false);

      toast({
        title: "Success!",
        description: "Your TANQR request has been submitted successfully.",
        variant: "default",
      });

      return response;
    } catch (error: any) {
      console.error("TANQR request error:", error);

      // Extract the error message
      const errorMessage =
        error?.message || "Failed to submit TANQR request. Please try again.";

      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: errorMessage,
      });

      throw error; // Re-throw to be handled by submitData
    }
  };

  const submitData = (values: TanqrFormData) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        if (values.merchantName && values.emailAddress) {
          await requestTanQr(values);
        }
      } catch (error: any) {
        console.error("Form submission error:", error);
        setError(error?.message || "An unexpected error occurred");
      }
    });
  };

  // Loading state
  if (isLoadingLocation) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
          <p className="text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Request TANQR</h1>
        <p className="text-gray-600 mt-2">
          You&apos;re about to request a TANQR code for your payments. Please
          verify your details before submitting.
        </p>
      </div>

      {/* Verification Alert */}
      {!isEditMode && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Please review your location information below. If any details are
            incorrect,{" "}
            <button
              type="button"
              onClick={() =>
                location?.id && router.push(`/locations/${location.id}`)
              }
              className="font-semibold underline hover:text-blue-700"
            >
              click here to edit
            </button>
            .
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          onChange={handleFormChange}
          className="space-y-6"
        >
          <FormError message={error} />
          <FormSuccess message={success} />

          {/* Business Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Location Information</CardTitle>
                  <CardDescription>
                    {isEditMode
                      ? "Update your location details"
                      : "Verify your location details"}
                  </CardDescription>
                </div>
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      location?.id && router.push(`/locations/${location.id}`)
                    }
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="merchantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Merchant Name
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Input
                          {...field}
                          disabled={isPending}
                          className="w-full"
                        />
                      ) : (
                        <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                          {field.value || "Not provided"}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Email Address
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input type="email" {...field} disabled={isPending} />
                        ) : (
                          <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                            {field.value || "Not provided"}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        {isEditMode ? (
                          <Input type="tel" {...field} disabled={isPending} />
                        ) : (
                          <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                            {field.value || "Not provided"}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl>
                      {isEditMode ? (
                        <Input {...field} disabled={isPending} />
                      ) : (
                        <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                          {field.value || "Not provided"}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditMode && (
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset({
                        merchantName: location?.name || "",
                        emailAddress: location?.email || "",
                        phoneNumber: location?.phone || "",
                        businessType: location?.locationBusinessTypeName || "",
                      });
                      setIsEditMode(false);
                    }}
                  >
                    Cancel Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>What to Expect</CardTitle>
              <CardDescription>After submission timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>
                    You will receive a confirmation email within 24 hours
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>
                    Your TANQR code will be activated within 2-3 business days
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>You may be contacted for additional verification</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex h-5 justify-end items-center space-x-4 pt-4">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={isPending ? "Submitting..." : "Verify & Submit Request"}
            />
          </div>
        </form>
      </Form>

      {/* Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Additional Verification Required
            </DialogTitle>
            <DialogDescription>
              We need to verify some additional information for your TANQR
              request.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600">
              Please check your email for verification instructions or wait for
              our team to contact you.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowVerificationDialog(false)}>
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RequestTanqrForm;
