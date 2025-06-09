'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, Loader2, DollarSign } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PhoneInput } from '@/components/ui/phone-input';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInvoice, payInvoice } from '@/lib/actions/invoice-actions';
import { verifyPayment } from '@/lib/actions/subscriptions';
import PaymentStatusModal from '@/components/widgets/paymentStatusModal';
import { InvoiceSchema } from '@/types/invoice/schema';
import { useToast } from '@/hooks/use-toast';
import { InvoiceItem, useInvoiceCalculations } from '@/hooks/useInvoiceCalculation';
import { useDiscountValidation } from '@/hooks/useDiscountValidation';
import CurrentSubscriptionStatus from '@/components/subscription/currentSubscriptionStatus';
import SubscriptionPlanCard from '@/components/subscription/subscriptionPlanCard';
// import AdditionalServiceCard from '@/components/subscription/additionalServiceCard';
import InvoiceItemCard from '@/components/subscription/invoiceItemCard';
import DiscountCodeInput from '@/components/widgets/discountCodeInput';
import { useSubscriptionData } from '@/hooks/useSubscriptionData';
import { UUID } from 'crypto';


type InvoiceFormData = z.infer<typeof InvoiceSchema>;

// const additionalServices = [
//   { id: 1, name: "Premium Support", amount: 10000 },
//   { id: 2, name: "Data Migration", amount: 15000 },
// ];

const InvoiceSubscriptionPage = () => {
  // State management
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType] = useState<'percentage' | 'fixed'>('percentage');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"INITIATING"|"PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom hooks
  const { activeSubscription, subscriptionData, isLoading: subscriptionLoading } = useSubscriptionData();
  const { subtotal, discountAmount, total } = useInvoiceCalculations(invoiceItems, discount, discountType);
  const { 
    isValidatingDiscount, 
    discountValid, 
    // validatedDiscountCode, 
    validateDiscount 
  } = useDiscountValidation();

  const { toast } = useToast();

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      email: '',
      phone: '',
      locationSubscriptions: [],
      discountCode: '',
    }
  });

  // Auto-add current subscription on load
  useEffect(() => {
    if (activeSubscription?.subscription && subscriptionData.length > 0) {
      const currentPlan = subscriptionData.find(plan => plan.id === activeSubscription.subscription.id);
      if (currentPlan) {
        setSelectedPlanId(currentPlan.id);
        const renewalItem: InvoiceItem = {
          id: Date.now(),
          type: 'subscription',
          itemId: currentPlan.id,
          name: currentPlan.packageName,
          unitPrice: currentPlan.amount,
          months: 1,
          totalPrice: currentPlan.amount,
          isRenewal: true,
          actionType: 'renew'
        };
        setInvoiceItems([renewalItem]);
      }
    }
  }, [activeSubscription, subscriptionData]);

  // Watch discount code changes
  const discountCode = useWatch({
    control: form.control,
    name: "discountCode",
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateDiscount(discountCode || '');
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [discountCode, validateDiscount]);


  const getActionType = useCallback((plan: any): 'upgrade' | 'downgrade' | 'renew' | 'switch' | 'subscribe' => {
    if (!activeSubscription?.subscription) return 'subscribe';
    
    const currentPlan = activeSubscription.subscription;
    if (plan.id === currentPlan.id) return 'renew';
    if (plan.amount > currentPlan.amount) return 'upgrade';
    if (plan.amount < currentPlan.amount) return 'downgrade';
    return 'switch';
  }, [activeSubscription]);

  // Event handlers
  const handlePlanSelection = useCallback((plan: any) => {
    const actionType = getActionType(plan);
    
    // Remove existing subscription items
    const nonSubscriptionItems = invoiceItems.filter(item => item.type !== 'subscription');
    
    // Add new subscription item
    const subscriptionItem: InvoiceItem = {
      id: Date.now(),
      type: 'subscription',
      itemId: plan.id,
      name: plan.packageName,
      unitPrice: plan.amount,
      months: 1,
      totalPrice: plan.amount,
      actionType: actionType,
      isRenewal: actionType === 'renew'
    };
    
    setSelectedPlanId(plan.id);
    setInvoiceItems([...nonSubscriptionItems, subscriptionItem]);
  }, [invoiceItems, getActionType]);

  // const addAdditionalService = useCallback((service: any) => {
  //   const existingService = invoiceItems.find(item => 
  //     item.type === 'service' && item.itemId === service.id.toString()
  //   );
    
  //   if (existingService) {
  //     toast({
  //       title: "Service Already Added",
  //       description: "This service is already in your invoice",
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   const newItem: InvoiceItem = {
  //     id: Date.now(),
  //     type: 'service',
  //     itemId: service.id.toString(),
  //     name: service.name,
  //     unitPrice: service.amount,
  //     months: 1,
  //     totalPrice: service.amount
  //   };
    
  //   setInvoiceItems(prev => [...prev, newItem]);
  // }, [invoiceItems, toast]);

  const removeInvoiceItem = useCallback((id: number) => {
    const item = invoiceItems.find(item => item.id === id);
    if (item?.type === 'subscription') {
      setSelectedPlanId(null);
    }
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  }, [invoiceItems]);

  const updateItemMonths = useCallback((id: number, months: number) => {
    setInvoiceItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, months: months, totalPrice: item.unitPrice * months }
        : item
    ));
  }, []);

  // Payment handling
  // Payment handling
  const handlePendingPayment = useCallback((transactionId: string, invoice: string) => {
    // console.log("Payment verification started");
    
    setTimeout(() => {
      let attemptCount = 0;
      const maxAttempts = 12;
      const pollingInterval = 5000;
      const maxDuration = 300000;
      const startTime = Date.now();
      
      const verificationInterval = setInterval(async () => {
        attemptCount++;

        if (Date.now() - startTime > maxDuration) {
          clearInterval(verificationInterval);
          setPaymentStatus("FAILED");
          toast({
            title: "Payment Timeout",
            description: "Payment verification timed out. Please check your payment status.",
            variant: "destructive"
          });
          return;
        }
        
        try {
          // console.log("Verification attempt:", attemptCount);
          const verificationResult = await verifyPayment(transactionId, invoice);
          setPaymentStatus(verificationResult.status);
          
          if (verificationResult.status === "SUCCESS") {
            clearInterval(verificationInterval);
            handleSuccessfulPayment(verificationResult);
          } else if (verificationResult.status === "PROCESSING") {
            setPaymentStatus("PROCESSING");
          } else if (verificationResult.status === "FAILED") {
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
            setTimeout(() => {
              setIsModalOpen(false);
            }, 2000);
          } else if (attemptCount >= maxAttempts) {
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          clearInterval(verificationInterval);
          setPaymentStatus("FAILED");
        }
      }, pollingInterval);
    }, 20000);
  }, [toast]);

  const handleCreateInvoice = useCallback(async (data: InvoiceFormData) => {
    if (invoiceItems.length === 0) {
      form.setError('locationSubscriptions', { 
        message: 'Please add at least one item to the invoice' 
      });
      return;
    }
  
    setIsLoading(true);
    setIsModalOpen(true);
    setPaymentStatus("INITIATING");
  
    try {
      const locationSubscriptions = invoiceItems
        .filter(item => item.type === 'subscription')
        .map(item => {
          const subscription = subscriptionData.find(sub => sub.id === item.itemId);
          
          if (!subscription) {
            throw new Error(`Subscription with ID ${item.itemId} not found`);
          }
  
          return {
            subscription: subscription.id,
            numberOfMonths: item.months,
          };
        });
  
      const invoicePayload = { locationSubscriptions };
      const response = await createInvoice(invoicePayload);
  
      if (response && typeof response === 'object' && 'id' in response && data.email && data.phone) {
        const invoiceId = (response as { id: UUID }).id;
        
        try {
          // Update status to PENDING before making payment
          setPaymentStatus("PENDING");
          
          const paymentResponse = await payInvoice(invoiceId, data.email, data.phone);
          setPaymentStatus("PROCESSING");
          handlePendingPayment(paymentResponse.id, paymentResponse.invoice);
        } catch (error) {
          console.error('Error making payment:', error);
          setPaymentStatus("FAILED");
        }
      } else {
        throw new Error("Missing data required to initiate payment");
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setPaymentStatus("FAILED");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceItems, subscriptionData, form, handlePendingPayment]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSuccessfulPayment = useCallback((response: any) => {
    setTimeout(() => {
      setIsModalOpen(false);
      window.location.href = `/renew-subscription`;
    }, 2000);
  }, []);

  

  

  const onFormError = useCallback((errors: any) => {
    console.log('Form validation errors:', errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive"
      });
    }
  }, [toast]);

  // Loading state
  if (subscriptionLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-start mt-14">
        {/* <h1 className="font-bold text-2xl mb-2">Create Subscription Invoice</h1> */}
        <p className="text-gray-600">
          {activeSubscription?.subscription 
            ? 'Manage your subscription or add additional services' 
            : 'Choose a subscription plan and add services'
          }
        </p>
      </div>

      {/* Current Subscription Status */}
      {activeSubscription?.subscription && (
        <CurrentSubscriptionStatus activeSubscription={activeSubscription} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Plans */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionData.map((plan :any) => {
                const actionType = getActionType(plan);
                const isSelected = selectedPlanId === plan.id;
                const isCurrent = activeSubscription?.subscription?.id === plan.id;
                
                return (
                  <SubscriptionPlanCard
                    key={plan.id}
                    plan={plan}
                    isSelected={isSelected}
                    isCurrent={isCurrent}
                    actionType={actionType}
                    onSelect={handlePlanSelection}
                  />
                );
              })}
            </div>
          </div>

          {/* Additional Services */}
          {/* <div>
            <h2 className="text-xl font-semibold mb-4">Additional Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additionalServices.map((service) => {
                const isAdded = invoiceItems.some(item => 
                  item.type === 'service' && item.itemId === service.id.toString()
                );
                
                return (
                  <AdditionalServiceCard
                    key={service.id}
                    service={service}
                    isAdded={isAdded}
                    onAdd={addAdditionalService}
                  />
                );
              })}
            </div>
          </div> */}
        </div>

        {/* Invoice Summary */}
        <div>
          <Card className="sticky top-6 border-t-4 border-t-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="mr-2" size={20} />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateInvoice, onFormError)} className="space-y-4">
                  {/* Customer Details */}
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Email *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="customer@example.com" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Phone *</FormLabel>
                          <FormControl>
                            <PhoneInput
                              placeholder="Enter phone number"
                              {...field}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Invoice Items */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Items</h4>
                    {invoiceItems.length === 0 ? (
                      <p className="text-gray-500 text-sm">No items added yet</p>
                    ) : (
                      <div className="space-y-3">
                        {invoiceItems.map((item) => (
                          <InvoiceItemCard
                            key={item.id}
                            item={item}
                            onRemove={removeInvoiceItem}
                            onUpdateMonths={updateItemMonths}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {invoiceItems.length > 0 && (
                    <>
                      <Separator />
                      
                      {/* Discount */}
                      <div className="space-y-3">
                        <DiscountCodeInput
                          control={form.control}
                          isValidating={isValidatingDiscount}
                          isValid={discountValid}
                          onClear={() => {
                            // Reset discount state when clearing
                            setDiscount(0);
                          }}
                        />
                      </div>

                      <Separator />

                      {/* Totals */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>TZS {subtotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span>-TZS {discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>TZS {total.toLocaleString()}</span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || invoiceItems.length === 0}
                        className="w-full"
                      >
                        {isLoading ? (
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
                    </>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          <PaymentStatusModal
            isOpen={isModalOpen}
            status={paymentStatus}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceSubscriptionPage;