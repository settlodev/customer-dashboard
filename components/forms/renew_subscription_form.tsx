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
import { RenewSubscriptionSchema } from "@/types/renew-subscription/schema";
import {
  Calendar,
  Mail,
  Phone,
  Tag,
  Check,
  X,
  Loader2,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { paySubscription, verifyPayment } from "@/lib/actions/subscriptions";
import { validateDiscountCode } from "@/lib/actions/subscriptions";
import { Button } from "../ui/button";
import { PhoneInput } from "../ui/phone-input";
import {
  ActiveSubscription,
  Subscriptions,
  ValidDiscountCode,
} from "@/types/subscription/type";
import { Alert, AlertDescription } from "../ui/alert";
import { NumericFormat } from "react-number-format";
import PaymentStatusModal from "../widgets/paymentStatusModal";

const RenewSubscriptionForm = ({
  activeSubscription,
  selectedPlan,
}: {
  activeSubscription?: ActiveSubscription;
  selectedPlan?: Subscriptions;
}) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountValid, setDiscountValid] = useState<boolean | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validatedDiscountCode, setValidatedDiscountCode] =
    useState<ValidDiscountCode | null>(null);

  const { toast } = useToast();

  const planToUse = selectedPlan || activeSubscription?.subscription;

  const form = useForm<z.infer<typeof RenewSubscriptionSchema>>({
    resolver: zodResolver(RenewSubscriptionSchema),
    defaultValues: {
      locationId: activeSubscription?.location ?? "",
      planId: planToUse?.id ?? "",
      quantity: 1,
      discount: "",
    },
  });

  useEffect(() => {
    if (selectedPlan?.id) {
      form.setValue("planId", selectedPlan.id);
    }
  }, [selectedPlan, form]);

  const quantity = useWatch({
    control: form.control,
    name: "quantity",
    defaultValue: 1,
  });
  const discountCode = useWatch({ control: form.control, name: "discount" });

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

  const validateDiscount = useCallback(
    async (code: string) => {
      setIsValidatingDiscount(true);
      try {
        const validateCode = await validateDiscountCode(code);
        setValidatedDiscountCode(validateCode);
        setDiscountValid(true);
        toast({
          title: "Discount Code Valid",
          description: "The discount code has been applied successfully",
          variant: "success",
        });
      } catch (error) {
        setDiscountValid(false);
      } finally {
        setIsValidatingDiscount(false);
      }
    },
    [toast],
  );

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description:
          typeof errors.message === "string"
            ? errors.message
            : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  const submitData = useCallback(
    async (values: z.infer<typeof RenewSubscriptionSchema>) => {
      setError(null);
      setIsModalOpen(true);
      setPaymentStatus("PENDING");

      const paymentValues = {
        ...values,
        discount: validatedDiscountCode?.discount,
      };

      startTransition(() => {
        paySubscription(paymentValues)
          .then((response) => {
            if (
              response.responseType === "error" ||
              response.status === "FAILED"
            ) {
              const errorMessage =
                response.errorDescription ||
                response.message ||
                "Payment failed. Please try again.";
              setError(errorMessage);
              toast({
                title: "Payment Failed",
                description: errorMessage,
                variant: "destructive",
              });
              return;
            }
            if (response.status === "PENDING") {
              const transactionId = response.id;
              if (!transactionId) return;
              handlePendingPayment(transactionId, values);
              return;
            } else {
              setPaymentStatus(response.status);
            }
            handleSuccessfulPayment(response, values);
          })
          .catch((err) => {
            const errorMessage =
              err.message || "An unexpected error occurred. Please try again.";
            setError(errorMessage);
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
          });
      });
    },
    [toast, validatedDiscountCode, startTransition],
  );

  const handlePendingPayment = useCallback(
    (
      transactionId: string,
      values: z.infer<typeof RenewSubscriptionSchema>,
    ) => {
      setTimeout(() => {
        let attemptCount = 0;
        const maxAttempts = 4;
        const pollingInterval = 5000;
        const verificationInterval = setInterval(async () => {
          attemptCount++;
          try {
            const verificationResult = await verifyPayment(transactionId);
            setPaymentStatus(verificationResult.status);
            if (verificationResult.status === "SUCCESS") {
              clearInterval(verificationInterval);
              handleSuccessfulPayment(verificationResult, values);
            } else if (verificationResult.status === "PROCESSING") {
              setPaymentStatus("PROCESSING");
            } else if (verificationResult.status === "FAILED") {
              clearInterval(verificationInterval);
              setPaymentStatus("FAILED");
              setTimeout(() => setIsModalOpen(false));
            } else if (attemptCount >= maxAttempts) {
              clearInterval(verificationInterval);
              setPaymentStatus("FAILED");
            }
          } catch (error) {
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
          }
        }, pollingInterval);
      }, 20000);
    },
    [],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSuccessfulPayment = useCallback(
    (response: any, values: z.infer<typeof RenewSubscriptionSchema>) => {
      setTimeout(() => {
        setIsModalOpen(false);
        window.location.href = `/renew-subscription`;
      }, 2000);
    },
    [],
  );

  const planAmount = planToUse?.amount || 0;
  const totalAmount = planAmount * quantity;

  if (!planToUse && !activeSubscription) {
    return (
      <Card className="shadow-md border-stroke">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Tag className="h-12 w-12 text-bodydark2 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              No Subscription Selected
            </h3>
            <p className="text-body">
              Please select a subscription plan to continue
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          className="w-full"
        >
          <Card className="shadow-md border border-stroke">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold text-black">
                Complete Your Purchase
              </CardTitle>
              <CardDescription className="text-body">
                {selectedPlan
                  ? `Subscribe to ${selectedPlan.packageName}`
                  : `Renew your ${activeSubscription?.subscription?.packageName} subscription`}
              </CardDescription>
            </CardHeader>

            {error && (
              <div className="px-6 pb-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <CardContent className="space-y-4">
              {/* Plan Summary */}
              <div className="bg-gray-2 rounded-md p-4 mb-4 border border-stroke">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body">Plan</span>
                  <span className="font-medium text-black">
                    {planToUse?.packageName}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-body">Price</span>
                  <span className="font-medium text-black">
                    TZS {Intl.NumberFormat().format(planAmount)}
                  </span>
                </div>
                <div className="border-t border-stroke my-2" />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium text-black">Total Amount</span>
                  <span className="text-lg font-semibold text-success">
                    TZS {Intl.NumberFormat().format(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Phone Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black font-medium">
                      Phone Number
                    </FormLabel>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-bodydark2">
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
                    <FormLabel className="text-black font-medium">
                      Email Address
                    </FormLabel>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-bodydark2">
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
                    <FormLabel className="text-black font-medium">
                      Renewal Duration
                    </FormLabel>
                    <div className="relative">
                      <div className="absolute left-3 top-2 text-bodydark2">
                        <Calendar size={18} />
                      </div>
                      <FormControl>
                        <NumericFormat
                          className="w-full border border-stroke rounded-md shadow-sm py-2 px-3 text-sm leading-4 text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary pl-10"
                          value={field.value}
                          disabled={isPending}
                          placeholder="Number of months"
                          thousandSeparator={true}
                          allowNegative={false}
                          onValueChange={(values) => {
                            const rawValue = Number(
                              values.value.replace(/,/g, ""),
                            );
                            field.onChange(rawValue);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-body mt-1">
                        Specify how many months you&lsquo;d like to renew for
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
                  <FormItem>
                    <FormLabel className="text-black font-medium">
                      Discount Code (Optional)
                    </FormLabel>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-bodydark2">
                        <Tag size={18} />
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            className={`pl-10 pr-10 ${isValidatingDiscount ? "bg-gray-2" : ""}`}
                            placeholder="Enter discount code"
                            disabled={isValidatingDiscount}
                          />
                          {field.value && (
                            <div className="absolute right-3 top-2">
                              {isValidatingDiscount ? (
                                <Loader2 className="h-5 w-5 animate-spin text-bodydark2" />
                              ) : discountValid === true ? (
                                <Check className="h-5 w-5 text-success" />
                              ) : discountValid === false ? (
                                <X
                                  className="h-5 w-5 text-danger cursor-pointer"
                                  onClick={() => field.onChange("")}
                                />
                              ) : null}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {discountValid === false && (
                        <p className="text-sm text-danger mt-1">
                          Invalid discount code
                        </p>
                      )}
                      {discountValid === true && (
                        <p className="text-sm text-success mt-1">
                          Discount applied successfully
                        </p>
                      )}
                      <FormMessage className="text-sm" />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                type="button"
                className="border-stroke text-body hover:bg-gray-2"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Processing</span>
                  </div>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      <PaymentStatusModal
        isOpen={isModalOpen}
        status={paymentStatus}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default RenewSubscriptionForm;
