'use client'
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Subscriptions, ValidDiscountCode } from "@/types/subscription/type";
import { AlertCircle, Calendar, Check, CheckCircle2, Loader2, Mail, Phone, Star, Tag, X } from "lucide-react";
import { getAllSubscriptions,paySubscription,User, validateDiscountCode, verifyPayment } from "@/lib/actions/subscriptions";
import { useSearchParams } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";
import { isValidPhoneNumber } from "libphonenumber-js";
import Loading from "@/app/loading";




const SubscriptionSchema = z.object({
  planId: z.string().min(1, "Subscription plan is required"),
  locationId: z.string().min(1, "Location is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string({ required_error: "Phone number is required" })
  .refine(isValidPhoneNumber, {
      message: "Invalid phone number",
  }),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  discount: z.string().optional(),
});

interface SubscriptionFeature {
  id: string;
  name: string;
}

interface Subscription {
  id: string;
  packageName: string;
  amount: number;
  subscriptionFeatures: SubscriptionFeature[];
}


const SubscriptionPage = () => {
  const [subscriptionData, setSubscriptionData] = useState<Subscriptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const locationId = searchParams.get("location") as string;
  const [userAuthenticated, setUserAuthenticated] = useState<User | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const subscriptions = await getAllSubscriptions();
        const currentUser = await getAuthenticatedUser();

        setUserAuthenticated(currentUser as User);
        setSubscriptionData(subscriptions);
      } catch (error) {
        console.error("Error fetching subscriptions", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subscription data. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [toast]);

  const handleGetStartedClick = (plan: Subscription) => {
    setSelectedPlan(plan);
    setIsFormModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8  mx-auto">
  <div className="max-w-7xl mx-auto">
    {/* Header Section */}
    <div className="text-start lg:text-center mb-3">
      <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2 ">
        Choose Your Perfect Plan for Your Business
      </h1>
      <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-4">
        Our flexible pricing options are designed to grow with your business, ensuring you have all the tools you need at every stage.
      </p>
    </div>

    {/* Features Grid */}
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-3">
      {subscriptionData.map((plan, index) => (
        <Card
          key={index}
          className={`w-full relative transform hover:scale-105 transition-transform duration-300 ${
            index === 1 ? "border-2 border-emerald-500" : ""
          }`}
        >
          {index === 1 && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-emerald-500 text-white px-3 py-1">
                <Star className="w-4 h-4 mr-1 inline" />
                <span className="hidden sm:inline">Most Popular</span>
              </Badge>
            </div>
          )}

          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold">{plan.packageName}</CardTitle>
            <div className="mt-2 sm:mt-4">
              <span className="text-2xl sm:text-3xl font-bold">TZS {Intl.NumberFormat().format(plan.amount)}</span>
              <span className="text-gray-500 ml-2">/month</span>
            </div>
            <CardDescription className="mt-2 sm:mt-4 text-gray-600">
              {/* Plan description */}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <ul className="space-y-2 sm:space-y-4">
              {plan.subscriptionFeatures.slice(0, 10).map((feature) => (
                <li key={feature.id} className="flex items-start space-x-2 sm:space-x-3">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-1" />
                  <span className="text-sm sm:text-base text-gray-700">{feature.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="p-4 sm:p-6">
            <Button
              onClick={() => handleGetStartedClick(plan)}
              className={`w-full py-3 sm:py-4 lg:py-6 text-base sm:text-lg font-semibold ${
                index === 1
                  ? "bg-emerald-500 hover:bg-emerald-200"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              Pay Now
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>

  {/* Subscription Form Modal */}
  {isFormModalOpen && selectedPlan && userAuthenticated && (
    <SubscriptionFormModal
      isOpen={isFormModalOpen}
      onClose={() => setIsFormModalOpen(false)}
      plan={selectedPlan}
      locationId={locationId}
      user={userAuthenticated}
      setPaymentStatus={setPaymentStatus}
      setIsPaymentModalOpen={setIsPaymentModalOpen}
    />
  )}

  {/* Payment Status Modal */}
  <PaymentStatusModal 
    isOpen={isPaymentModalOpen} 
    status={paymentStatus} 
    onClose={() => setIsPaymentModalOpen(false)} 
  />
</div>
  );
};

// Subscription Form Modal Component
const SubscriptionFormModal = ({ 
  isOpen, 
  onClose, 
  plan, 
  locationId, 
  user,
  setPaymentStatus,
  setIsPaymentModalOpen
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  plan: Subscription; 
  locationId: string; 
  user: User;
  setPaymentStatus: React.Dispatch<React.SetStateAction<"PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null>>;
  setIsPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {


 

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [discountValid, setDiscountValid] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [validatedDiscountCode, setValidatedDiscountCode] = useState<ValidDiscountCode | null>(null);
  

  // Initialize form with default values
  const form = useForm<z.infer<typeof SubscriptionSchema>>({
    resolver: zodResolver(SubscriptionSchema),
    defaultValues: {
      locationId: locationId || '',
      planId: plan.id || '',
      email: user?.email || '',
      phone: user?.phoneNumber || '',
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

  // Handle discount code validation with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (discountCode && discountCode.length > 0) {
        validateDiscount(discountCode,locationId);
      } else {
        setDiscountValid(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [discountCode,locationId]);

  //Validate discount code
  const validateDiscount = async (code: string,locationId?:string) => {
    
    setIsValidatingDiscount(true);
    try {
      const validateCode = await validateDiscountCode(code,locationId);
      setValidatedDiscountCode(validateCode);
      setDiscountValid(true);
      toast({
        title: "Discount Code Valid",
        description: "The discount code has been applied successfully",
        variant: "default"
      });
    } catch (error) {
      setDiscountValid(false);
      // console.log("Error validating discount code:", error);
      throw error
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  // Handle form submission errors
  const onInvalid = useCallback(
    (errors: any) => {
      // console.log("Form errors:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  // Submit subscription data
  const submitData = async (values: z.infer<typeof SubscriptionSchema>) => {
    setError(null);
    onClose(); // Close the form modal
    setIsPaymentModalOpen(true); // Open the payment modal
    setPaymentStatus("PENDING");
    
    const paymentValues = {
      ...values,
      discount: validatedDiscountCode?.discount 
    };

    startTransition(() => {
      paySubscription(paymentValues)
        .then((response) => {
          if (response.responseType === "error" || response.status === "FAILED") {
            const errorMessage = response.errorDescription || response.message || "Payment failed. Please try again.";
            setError(errorMessage);
            setPaymentStatus("FAILED");
            toast({
              title: "Payment Failed",
              description: errorMessage,
              variant: "destructive"
            });
            return;
          }
          
          if (response.status === "PENDING") {
            // Start polling to check payment status
            const transactionId = response.id;
            if (!transactionId) {
              console.error("No transaction ID found for pending payment");
              setPaymentStatus("FAILED");
              return;
            }
            
            // Call function to handle payment verification
            handlePendingPayment(transactionId, values);
            return;
          }
          else {
            setPaymentStatus(response.status);
          }
          
          // Handle success case
          if (response.status === "SUCCESS") {
            handleSuccessfulPayment();
          }
        })
        .catch((err) => {
          console.error("Payment error:", err);
          const errorMessage = err.message || "An unexpected error occurred. Please try again.";
          setError(errorMessage);
          setPaymentStatus("FAILED");
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          });
        });
    });
  };
  
  // Function to handle pending payment verification
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePendingPayment = (transactionId: string, values: z.infer<typeof SubscriptionSchema>) => {
    // Initial delay for 20 seconds before starting verification
    setTimeout(() => {
      // Set up a counter to limit the number of verification attempts
      let attemptCount = 0;
      const maxAttempts = 3; // Adjust as needed
      const pollingInterval = 5000; // 5 seconds
      
      // Create a polling interval
      const verificationInterval = setInterval(async () => {
        attemptCount++;
        
        try {
          const verificationResult = await verifyPayment(transactionId,locationId);
          setPaymentStatus(verificationResult.status);
          
          // Check if payment status has changed
          if (verificationResult.status === "SUCCESS") {
            clearInterval(verificationInterval);
            handleSuccessfulPayment();
          }
          else if (verificationResult.status === "PROCESSING") {
            // If still processing, continue polling
            setPaymentStatus("PROCESSING");
          } 
          else if (verificationResult.status === "FAILED") {
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
            setTimeout(() => {
              setIsPaymentModalOpen(false);
            }, 2000);
          } else if (attemptCount >= maxAttempts) {
            // Stop polling after max attempts
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          clearInterval(verificationInterval);
          setPaymentStatus("FAILED");
        }
      }, pollingInterval);
    }, 20000); // 20 seconds delay before starting verification
  };
  
  // Handle successful payment
  const handleSuccessfulPayment = () => {
    setTimeout(() => {
      setIsPaymentModalOpen(false);
      window.location.href = `/select-location`;
    }, 2000);
  };

  if (!isOpen) return null;

  const totalAmount = plan.amount * quantity;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">{plan.packageName} Subscription</h2>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            
            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="mb-4">
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
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
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
                <FormItem className="mb-4">
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
                <FormItem className="mb-4">
                  <FormLabel className="text-gray-700 font-medium">
                    Subscription Duration
                  </FormLabel>
                  <div className="relative">
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
                      Specify how many months you&rsquo;d like to subscribe for
                    </FormDescription>
                    <FormMessage className="text-sm" />
                  </div>
                </FormItem>
              )}
            />

            {/* Discount Code Field */}
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem className="mb-6">
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
                          className={`pl-10 pr-10 ${isValidatingDiscount ? 'bg-gray-50' : ''}`}
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
                              <X className="h-5 w-5 text-red-500" onClick={() => field.onChange('')} />
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
            <div className="bg-gray-100 p-4 rounded-md mb-6">
              <h4 className="text-lg font-semibold text-gray-800">
                Total Amount: TZS {Intl.NumberFormat().format(totalAmount)}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {quantity} month{quantity !== 1 ? 's' : ''} subscription
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                type="button"
                className="w-28"

                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                type="submit"
                className="w-28"
                disabled={isPending}
                onClick = {()=>console.log('Button clicked')}
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
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SubscriptionPage;
