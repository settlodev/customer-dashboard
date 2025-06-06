'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Tag, Clock, AlertCircle, Plus, Trash2, Receipt, ArrowUp, ArrowDown, RotateCcw, Loader2, Check, X, ArrowRight, DollarSign } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PhoneInput } from '@/components/ui/phone-input';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getActiveSubscription, getAllSubscriptions, validateDiscountCode, verifyPayment } from '@/lib/actions/subscriptions';
import { ActiveSubscription, Subscriptions, ValidDiscountCode } from '@/types/subscription/type';
import { useToast } from '@/hooks/use-toast';
import { InvoiceSchema } from '@/types/invoice/schema';
import { createInvoice, payInvoice } from '@/lib/actions/invoice-actions';
import PaymentStatusModal from '@/components/widgets/paymentStatusModal';



const additionalServices = [
  { id: 1, name: "Premium Support", amount: 10000 },
  { id: 2, name: "Data Migration", amount: 15000 },
];



type InvoiceFormData = z.infer<typeof InvoiceSchema>;

interface InvoiceItem {
  id: number;
  type: 'subscription' | 'service';
  itemId: string;
  name: string;
  unitPrice: number;
  months: number;
  totalPrice: number;
  actionType?: 'upgrade' | 'downgrade' | 'renew' | 'switch' | 'subscribe';
  isRenewal?: boolean;
}

interface PaymentResponse {
  id: string;
  invoice: string;
  status?: string;
}

const InvoiceSubscriptionPage = () => {
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription>();
  const [subscriptionData, setSubscriptionData] = useState<Subscriptions[]>([]);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountValid, setDiscountValid] = useState<boolean | null>(null);
  const [validatedDiscountCode, setValidatedDiscountCode] = useState<ValidDiscountCode | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      email: '',
      phone: '',
      locationSubscriptions: [],
      discountCode: '',
    }
  });

  useEffect(() => {
    const fetchActiveSubscription = async () => {
      try {
        const activeSubs = await getActiveSubscription();
        const subscriptions = await getAllSubscriptions();
        console.log('Subscriptions:', subscriptions);
        setActiveSubscription(activeSubs);
        setSubscriptionData(subscriptions);
        
        // Auto-add current subscription to invoice if it exists
        if (activeSubs?.subscription) {
          const currentPlan = subscriptions.find(plan => plan.id === activeSubs.subscription.id);
          if (currentPlan) {
            setSelectedPlanId(currentPlan.id);
            // Add current subscription as renewal
            const renewalItem = {
              id: Date.now(),
              type: 'subscription',
              itemId: currentPlan.id,
              name: currentPlan.packageName,
              unitPrice: currentPlan.amount,
              months: 1,
              totalPrice: currentPlan.amount,
              isRenewal: true
            };
            setInvoiceItems([renewalItem]);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveSubscription();
  }, []);

  // Calculate days until expiration
  const daysUntilExpiration = useCallback(() => {
    if (!activeSubscription?.endDate) return 0;
    const end = new Date(activeSubscription.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [activeSubscription?.endDate]);

  // Get status color based on expiration
  const getStatusColor = useCallback(() => {
    const days = daysUntilExpiration();
    if (days <= 7) return "text-red-500";
    if (days <= 30) return "text-amber-500";
    return "text-emerald-500";
  }, [daysUntilExpiration]);

  // Determine action type for plans
  const getActionType = useCallback((plan: any) => {
    if (!activeSubscription?.subscription) return 'subscribe';
    
    const currentPlan = activeSubscription.subscription;
    if (plan.id === currentPlan.id) return 'renew';
    if (plan.amount > currentPlan.amount) return 'upgrade';
    if (plan.amount < currentPlan.amount) return 'downgrade';
    return 'switch';
  }, [activeSubscription]);

  // Get action label and icon
  const getActionLabel = useCallback((plan: any) => {
    const actionType = getActionType(plan);
    const labels = {
      renew: 'Renew Plan',
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
      switch: 'Switch Plan',
      subscribe: 'Select Plan'
    };
    return labels[actionType] || 'Select Plan';
  }, [getActionType]);

  const getActionIcon = useCallback((plan: any) => {
    const actionType = getActionType(plan);
    const icons = {
      upgrade: <ArrowUp className="w-4 h-4 mr-1" />,
      downgrade: <ArrowDown className="w-4 h-4 mr-1" />,
      renew: <RotateCcw className="w-4 h-4 mr-1" />,
      switch: <ArrowRight className="w-4 h-4 mr-1" />,
      subscribe: <Plus className="w-4 h-4 mr-1" />
    };
    return icons[actionType] || icons.subscribe;
  }, [getActionType]);

  // Handle plan selection
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
      actionType: actionType as any,
      isRenewal: actionType === 'renew'
    };
    
    setSelectedPlanId(plan.id);
    setInvoiceItems([...nonSubscriptionItems, subscriptionItem]);
  }, [invoiceItems, getActionType]);

  // Add additional service
  const addAdditionalService = useCallback((service: any) => {
    const existingService = invoiceItems.find(item => 
      item.type === 'service' && item.itemId === service.id.toString()
    );
    
    if (existingService) {
      alert('This service is already added to the invoice');
      return;
    }

    const newItem: InvoiceItem = {
      id: Date.now(),
      type: 'service',
      itemId: service.id.toString(),
      name: service.name,
      unitPrice: service.amount,
      months: 1,
      totalPrice: service.amount
    };
    
    setInvoiceItems(prev => [...prev, newItem]);
  }, [invoiceItems]);

  // Remove invoice item
  const removeInvoiceItem = useCallback((id: number) => {
    const item = invoiceItems.find(item => item.id === id);
    if (item?.type === 'subscription') {
      setSelectedPlanId(null);
    }
    setInvoiceItems(prev => prev.filter(item => item.id !== id));
  }, [invoiceItems]);

  // Update item months
  const updateItemMonths = useCallback((id: number, months: number) => {
    setInvoiceItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, months: months, totalPrice: item.unitPrice * months }
        : item
    ));
  }, []);

  // Calculate totals
  const calculateSubtotal = useCallback(() => {
    return invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [invoiceItems]);

  const calculateDiscount = useCallback(() => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return discount;
  }, [calculateSubtotal, discount, discountType]);

  const calculateTotal = useCallback(() => {
    return Math.max(0, calculateSubtotal() - calculateDiscount());
  }, [calculateSubtotal, calculateDiscount]);

  const discountCode = useWatch({
    control: form.control,
    name: "discountCode",
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

  const validateDiscount = useCallback(async (code: string) => {
    setIsValidatingDiscount(true);
    try {
      const validateCode = await validateDiscountCode(code);
      setValidatedDiscountCode(validateCode);
      setDiscountValid(true);
      toast({
        title: "Discount Code Valid",
        description: "The discount code has been applied successfully",
        variant: "default"
      });
    } catch (error) {
      setDiscountValid(false);
      console.log("Error validating discount code:", error);
    } finally {
      setIsValidatingDiscount(false);
    }
  }, [toast]);

  // Handle form submission
  const handleCreateInvoice = useCallback(async (data: InvoiceFormData) => {
    if (invoiceItems.length === 0) {
      form.setError('locationSubscriptions', { 
        message: 'Please add at least one item to the invoice' 
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Transform invoice items to match schema
      const locationSubscriptions = invoiceItems
      .filter(item => item.type === 'subscription')
      .map(item => {
        // Find the actual subscription object to get the UUID
        const subscription = subscriptionData.find(sub => sub.id === item.itemId);
        
        if (!subscription) {
          throw new Error(`Subscription with ID ${item.itemId} not found`);
        }

        return {
          subscription: subscription.id, // This should be the UUID string
          numberOfMonths: item.months,
          // subscriptionDiscount: discountType === 'percentage' 
          //   ? (item.totalPrice * discount) / 100 
          //   : discount
        };
      });

      // Create invoice payload matching the schema
      const invoicePayload = {
        locationSubscriptions
      };
  
      const response = await createInvoice(invoicePayload);
  
      // If the invoice was created successfully, make the payment
      if (response) {
        setIsModalOpen(true);
        try {
          const paymentResponse= await payInvoice(response.id, data.email, data.phone);
          // Since payInvoice returns void, we'll set a default status
          setPaymentStatus("PROCESSING");
          // Start polling for payment status
          handlePendingPayment(paymentResponse.id, paymentResponse.invoice);
        } catch (error) {
          console.error('Error making payment:', error);
          setPaymentStatus("FAILED");
        }
      }
  
      
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      setPaymentStatus("FAILED");
    } 
    finally {
      setIsLoading(false);
    }
  }, [invoiceItems]);

   // Function to handle pending payment verification
   const handlePendingPayment = useCallback((transactionId: string,invoice:string) => {

    console.log("Payment verification started");
    //initial delay for 20 seconds before starting verification
    setTimeout(() => {
       // Set up a counter to limit the number of verification attempts
      let attemptCount = 0;
      const maxAttempts = 12; // Adjust as needed
      const pollingInterval = 5000; // 5 seconds, adjust as needed
      const maxDuration = 300000; // 5 minutes total timeout
      const startTime = Date.now();
      
      // Create a polling interval
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
          console.log("Verification attempt:", attemptCount);
          const verificationResult = await verifyPayment(transactionId,invoice);
          setPaymentStatus(verificationResult.status);
          
          // Check if payment status has changed
          if (verificationResult.status === "SUCCESS") {
            clearInterval(verificationInterval);
            handleSuccessfulPayment(verificationResult);
          }
          else if (verificationResult.status === "PROCESSING") {
            // If still pending, continue polling
            setPaymentStatus("PROCESSING")
          } 
          else if (verificationResult.status === "FAILED") {
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
            setTimeout(() => {
              setIsModalOpen(false);
            })
            
          } else if (attemptCount >= maxAttempts) {
            // Stop polling after max attempts
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
          }
          // If still pending, continue polling
          
        } catch (error) {
          console.error("Payment verification error:", error );
          clearInterval(verificationInterval);
          setPaymentStatus("FAILED");
        }
      }, pollingInterval);
    }, 20000);
  }, []);

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const handleSuccessfulPayment = useCallback((response: any) => {
    setTimeout(() => {
      setIsModalOpen(false);
      window.location.href = `/renew-subscription`;
    }, 2000)
  }, []);

  // Handle form errors
  const onFormError = useCallback((errors: any) => {
    console.log('Form validation errors:', errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      alert(firstError.message);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mt-14">
        <h1 className="font-bold text-2xl mb-2">Create Subscription Invoice</h1>
        <p className="text-gray-600">
          {activeSubscription?.subscription 
            ? 'Manage your subscription or add additional services' 
            : 'Choose a subscription plan and add services'
          }
        </p>
      </div>

      {/* Current Subscription Status */}
      {activeSubscription?.subscription && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center mb-2">
                <Tag className="text-emerald-500 mr-2" size={20} />
                Current Plan: <span className="ml-2 font-bold text-emerald-600">{activeSubscription.subscription.packageName}</span>
              </h2>
              <p className="text-gray-600 mb-4">
                Your subscription will {daysUntilExpiration() < 0 ? 'expired' : 'expire'} on {
                  activeSubscription.endDate ? new Date(activeSubscription.endDate).toLocaleDateString() : 'N/A'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <Clock className={getStatusColor()} size={18} />
              <span className={`font-medium ${getStatusColor()}`}>
                {daysUntilExpiration() < 0 
                  ? 'Expired'
                  : daysUntilExpiration() <= 0 
                    ? 'Expires today' 
                    : `${daysUntilExpiration()} days remaining`
                }
              </span>
            </div>
          </div>
          
          {daysUntilExpiration() <= 14 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
              <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-amber-800">
                  {daysUntilExpiration() < 0 
                    ? 'Your subscription has expired.' 
                    : 'Your subscription is ending soon.'}
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Renew now to avoid service interruption and continue enjoying all features.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Plans */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionData.map((plan) => {
                const actionType = getActionType(plan);
                const isSelected = selectedPlanId === plan.id;
                const isCurrent = activeSubscription?.subscription?.id === plan.id;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`hover:shadow-lg transform transition-all duration-300 cursor-pointer relative
                      ${isSelected 
                        ? "border-2 border-emerald-500 shadow-md scale-[1.02]" 
                        : "border border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                        Current
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{plan.packageName}</CardTitle>
                      <div className="text-xl font-bold">
                        TZS {plan.amount.toLocaleString()}
                        <span className="text-sm text-gray-500 font-normal">/month</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <ul className="space-y-2 mb-4">
                        {plan.subscriptionFeatures.slice(0, 5).map((feature) => (
                          <li key={feature.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {feature.name}
                          </li>
                        ))}
                        {plan.subscriptionFeatures.length > 5 && (
                          <li className="text-xs text-gray-600 italic pl-6">
                            +{plan.subscriptionFeatures.length - 5} more features
                          </li>
                        )}
                      </ul>
                      
                      <Button
                        size="sm"
                        onClick={() => handlePlanSelection(plan)}
                        className={`w-full ${
                          actionType === 'upgrade' ? 'bg-blue-500 hover:bg-blue-600' :
                          actionType === 'downgrade' ? 'bg-orange-500 hover:bg-orange-600' :
                          actionType === 'renew' ? 'bg-emerald-500 hover:bg-emerald-600' :
                          'bg-gray-500 hover:bg-gray-600'
                        }`}
                        disabled={isSelected}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Selected
                          </>
                        ) : (
                          <>
                            {getActionIcon(plan)}
                            {getActionLabel(plan)}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Additional Services */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Additional Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additionalServices.map((service) => {
                const isAdded = invoiceItems.some(item => 
                  item.type === 'service' && item.itemId === service.id.toString()
                );
                
                return (
                  <Card key={service.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <div className="text-xl font-bold">
                        TZS {service.amount.toLocaleString()}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        size="sm"
                        onClick={() => addAdditionalService(service)}
                        className="w-full"
                        disabled={isAdded}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Service
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
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
                          <div key={item.id} className="bg-gray-50 p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {item.name}
                                  {item.actionType && (
                                    <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                      item.actionType === 'upgrade' ? 'bg-blue-100 text-blue-700' :
                                      item.actionType === 'downgrade' ? 'bg-orange-100 text-orange-700' :
                                      item.actionType === 'renew' ? 'bg-emerald-100 text-emerald-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {item.actionType.charAt(0).toUpperCase() + item.actionType.slice(1)}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-600">
                                  TZS {item.unitPrice.toLocaleString()}
                                  {item.type === 'subscription' && '/month'}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeInvoiceItem(item.id)}
                                className="p-1 h-auto text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {item.type === 'subscription' && (
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">Months:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={item.months}
                                  onChange={(e) => updateItemMonths(item.id, parseInt(e.target.value) || 1)}
                                  className="w-16 h-7 text-xs"
                                />
                              </div>
                            )}
                            <div className="text-right mt-2">
                              <span className="font-semibold text-sm">
                                TZS {item.totalPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {invoiceItems.length > 0 && (
                    <>
                      <Separator />
                      
                      {/* Discount */}
                      <div className="space-y-3">
                      <FormField
                control={form.control}
                name="discountCode"
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
                                <X className="h-5 w-5 text-red-500 cursor-pointer" onClick={() => {
                                  field.onChange('');
                                }} />
                              ) : null}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {discountValid === false && (
                        <p className="text-sm text-red-500 mt-1">
                          Invalid discount code
                        </p>
                      )}
                      {discountValid === true && (
                        <p className="text-sm text-green-600 mt-1">
                          Discount applied successfully
                        </p>
                      )}
                      <FormMessage className="text-sm" />
                    </div>
                  </FormItem>
                )}
              />
                      </div>

                      <Separator />

                      {/* Totals */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>TZS {calculateSubtotal().toLocaleString()}</span>
                        </div>
                        {calculateDiscount() > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span>-TZS {calculateDiscount().toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>TZS {calculateTotal().toLocaleString()}</span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || invoiceItems.length === 0}
                        className="w-full"
                        // disabled={isLoading}
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