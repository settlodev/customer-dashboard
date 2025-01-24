"use client";

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
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import { RenewSubscriptionSchema } from "@/types/renew-subscription/schema";
import { Calendar,Mail, Phone,Tag } from "lucide-react";
import {paySubscription } from "@/lib/actions/subscriptions";
import { Button } from "../ui/button";
import { PhoneInput } from "../ui/phone-input";
import { ActiveSubscription } from "@/types/subscription/type";

const RenewSubscriptionForm = ({ activeSubscription }: { activeSubscription?: ActiveSubscription }) => {
 
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [showTotalAmount, setShowTotalAmount] = useState(false);
  const { toast } = useToast();
  
  
  const form = useForm<z.infer<typeof RenewSubscriptionSchema>>({
    resolver: zodResolver(RenewSubscriptionSchema),
    defaultValues: {
      planId: activeSubscription?.subscription.id ?? '',
      // quantity: 1,
    },
  });

  // Watch the quantity field
  const quantity = useWatch({
    control: form.control,
    name: "quantity", 
    defaultValue: 1, 
  });



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

  const submitData = (values: z.infer<typeof RenewSubscriptionSchema>) => {
    console.log("Submitting data:", values);
    setShowTotalAmount(true);
    startTransition(() => {
      paySubscription(values)
        .then((data: any) => {
          if (data) {
            const formResponse: FormResponse = {
              responseType: data.responseType,
              message: data.message,
            };
            setResponse(formResponse);
            toast({
              title: "Payment Confirmation",
              description: `You will be paying $${totalAmount} for ${quantity} month subscription`,
              variant: "default"
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    })

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
                        {...field} disabled={isPending}
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
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <Calendar size={18} />
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        className="pl-10"
                        placeholder="Number of months"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(Number(value));
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

            {/* Discount Code Field */}
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
                      <Input
                        {...field}
                        className="pl-10"
                        placeholder="Enter discount code"
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </div>
                </FormItem>
              )}
            />
            {showTotalAmount && (
              <div className="bg-gray-100 p-4 rounded-md">
                <h4 className="text-lg font-semibold text-gray-800">
                  Total Amount: {Intl.NumberFormat().format(totalAmount)}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {quantity} month{quantity !== 1 ? 's' : ''} subscription
                </p>
              </div>
            )}
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
              disabled={isPending}
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


