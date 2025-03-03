import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldErrors, useForm, useWatch } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
// import { FormResponse } from "@/types/types";
import { RenewSubscriptionSchema } from "@/types/renew-subscription/schema";
import { Calendar, Mail, Phone, Tag, Check, X, Loader2, AlertCircle } from "lucide-react";
import { paySubscription, verifyPayment } from "@/lib/actions/subscriptions";
import { validateDiscountCode } from "@/lib/actions/subscriptions";
import { Button } from "../ui/button";
import { PhoneInput } from "../ui/phone-input";
import { ActiveSubscription } from "@/types/subscription/type";
import { Alert, AlertDescription } from "../ui/alert";
import { NumericFormat } from "react-number-format";

const RenewSubscriptionForm = ({ activeSubscription }: { activeSubscription?: ActiveSubscription }) => {
  const [isPending, startTransition] = useTransition();
  // const [, setResponse] = useState<FormResponse | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountValid, setDiscountValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof RenewSubscriptionSchema>>({
    resolver: zodResolver(RenewSubscriptionSchema),
    defaultValues: {
      planId: activeSubscription?.subscription.id ?? '',
      quantity: 1,
      discount: "",
    },
  });

  const quantity = useWatch({
    control: form.control,
    name: "quantity",
    defaultValue: 1,
  });

  const discountCode = useWatch({
    control: form.control,
    name: "discount",
  });

 

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (discountCode && discountCode.length > 0) {
        validateDiscount(discountCode);
      } else {
        setDiscountValid(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [discountCode]);

  const validateDiscount = async (code: string) => {
    setIsValidatingDiscount(true);
    try {
      await validateDiscountCode(code);
      setDiscountValid(true);
      toast({
        title: "Discount Code Valid",
        description: "The discount code has been applied successfully",
        variant: "default"
      });
    } catch (error) {
      setDiscountValid(false);
      console.log("Error validating discount code:", error);
      // toast({
      //   title: "Invalid Discount Code",
      //   description: "Please check your discount code and try again",
      //   variant: "destructive"
      // });
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Errors during form submission:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

 

  const submitData = async (values: z.infer<typeof RenewSubscriptionSchema>) => {
    setError(null);
    
    startTransition(() => {
      paySubscription(values)
        .then((response) => {
          if (response.responseType === "error" || response.status === "FAILED") {
            const errorMessage = response.errorDescription || response.message || "Payment failed. Please try again.";
            setError(errorMessage);
            toast({
              title: "Payment Failed",
              description: errorMessage,
              variant: "destructive"
            });
            return;
          }
  
          console.log("Payment response:", response);
          
          if (response.status === "PENDING") {
            toast({
              title: "Payment Pending",
              description: "Your payment is processing. Please wait...",
              variant: "default"
            });
            
            // Start polling to check payment status
            const transactionId = response.id;
            console.log("Transaction ID:", transactionId);
            if (!transactionId) {
              console.error("No transaction ID found for pending payment");
              return;
            }
            
            // Call function to handle payment verification
            handlePendingPayment(transactionId, values);
            return;
          }
          
          // Handle success case
          handleSuccessfulPayment(response, values);
        })
        .catch((err) => {
          console.error("Payment error:", err);
          const errorMessage = err.message || "An unexpected error occurred. Please try again.";
          setError(errorMessage);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          });
        });
    });
  };
  
  // Function to handle pending payment verification
  const handlePendingPayment = (transactionId: string, values: z.infer<typeof RenewSubscriptionSchema>) => {
    // Set up a counter to limit the number of verification attempts
    let attemptCount = 0;
    const maxAttempts = 5; // Adjust as needed
    const pollingInterval = 1000; // 1 seconds, adjust as needed
    
    // Create a polling interval
    const verificationInterval = setInterval(async () => {
      attemptCount++;
      
      try {
        const verificationResult = await verifyPayment(transactionId);
        console.log("Verification result:", verificationResult);
        
        // Check if payment status has changed
        if (verificationResult.status === "SUCCESS") {
          clearInterval(verificationInterval);
          handleSuccessfulPayment(verificationResult, values);
        } else if (verificationResult.status === "FAILED") {
          clearInterval(verificationInterval);
          const errorMessage = verificationResult.errorDescription || 
            verificationResult.message || 
            "Payment verification failed. Please try again.";
          setError(errorMessage);
          toast({
            title: "Payment Failed",
            description: errorMessage,
            variant: "destructive"
          });
        } else if (attemptCount >= maxAttempts) {
          // Stop polling after max attempts
          clearInterval(verificationInterval);
          toast({
            title: "Payment Status Unclear",
            description: "We couldn't confirm your payment status. Please check your email or account for updates.",
            variant: "default"
          });
        }
        // If still pending, continue polling
        
      } catch (error) {
        console.error("Payment verification error:", error);
        clearInterval(verificationInterval);
        toast({
          title: "Verification Error",
          description: "Failed to verify payment status. Please check your account later.",
          variant: "destructive"
        });
      }
    }, pollingInterval);
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSuccessfulPayment = (response: any, values: z.infer<typeof RenewSubscriptionSchema>) => {
    toast({
      title: "Payment Successful",
      description: `You have successfully paid ${totalAmount} for ${quantity} month subscription`,
      variant: "default"
    });
    
    // Add any additional success handling here (e.g., redirects, UI updates)
  };

  if (!activeSubscription) {
    return null;
  }

  const { subscription } = activeSubscription;
  const totalAmount = subscription.amount * quantity;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="w-full max-w-5xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-gray-900">Renew Subscription</CardTitle>
            <CardDescription className="text-gray-500">
              Enter your details below to renew your subscription
            </CardDescription>
          </CardHeader>

          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <CardContent className="space-y-6">
            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Phone Number
                  </FormLabel>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <Phone size={18} />
                    </div>
                    <FormControl className="w-full border-1 rounded-sm">
                      <PhoneInput
                        placeholder="Enter phone number"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </div>
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Email Address
                  </FormLabel>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <Mail size={18} />
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        className="pl-10"
                        placeholder="Enter your email"
                        type="email"
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </div>
                </FormItem>
              )}
            />

            {/* Quantity Field */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Renewal Duration
                  </FormLabel>
                  <div className="relative ">
                    <div className="absolute left-3 top-2 text-gray-400">
                      <Calendar size={18} />
                    </div>
                    <FormControl>
                      <NumericFormat
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-2 pl-10"
                          value={field.value}
                          disabled={isPending}
                          placeholder="Number of months"
                          thousandSeparator={true}
                          allowNegative={false}
                          onValueChange={(values) => {
                            const rawValue = Number(values.value.replace(/,/g, ""));
                            field.onChange(rawValue);
                          }}
                        />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500 mt-1">
                      Specify how many months you&lsquo;d like to renew for
                    </FormDescription>
                    <FormMessage className="text-sm" />
                  </div>
                </FormItem>
              )}
            />

            {/* Discount Code Field with Enhanced Validation Status */}
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Discount Code (Optional)
                  </FormLabel>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <Tag size={18} />
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          className={`pr-10 ${isValidatingDiscount ? 'bg-gray-50' : ''}`}
                          placeholder="Enter discount code"
                          disabled={isValidatingDiscount}
                        />
                        {field.value && (
                          <div className="absolute right-3 top-2">
                            {isValidatingDiscount ? (
                              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                            ) : discountValid === true ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : discountValid === false ? (
                              <X className="h-5 w-5 text-red-500" onClick={
                                () => {
                                  field.onChange('');
                                }
                              } />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {discountValid === false && (
                      <p className="text-sm text-red-500 mt-1">
                        Invalid discount code.
                      </p>
                    )}
                    <FormMessage className="text-sm" />
                  </div>
                </FormItem>
              )}
            />

            {/* Total Amount Display */}
            <div className="bg-gray-100 p-4 rounded-md">
              <h4 className="text-lg font-semibold text-gray-800">
                Total Amount: {Intl.NumberFormat().format(totalAmount)}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {quantity} month{quantity !== 1 ? 's' : ''} subscription
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-4 pt-6">
            <Button
              variant="outline"
              type="button"
              className="w-28"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              className="w-28"
              // disabled={!!isPayButtonDisabled}
            >
              {isPending ? (
                <div className="flex items-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Processing</span>
                </div>
              ) : (
                "Pay Now"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

export default RenewSubscriptionForm;