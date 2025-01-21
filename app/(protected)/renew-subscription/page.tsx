'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, Tag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SubscriptionRenewal = () => {
  // Sample subscription data - replace with actual data from your backend
  const currentSubscription = {
    plan: "Premium Plan",
    endDate: "2025-02-21",
    previousDiscount: "EARLY2024",
    price: 19.99
  };

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [discountCode, setDiscountCode] = useState("");

  const handleRenewal = () => {
    // Implement your renewal logic here
    console.log("Renewing subscription with:", { phone, amount, discountCode });
  };

  // Calculate days until expiration
  const daysUntilExpiration = () => {
    const end = new Date(currentSubscription.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Current Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Your subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-lg">
            <Tag className="text-emarald-500" />
            <span>Plan: {currentSubscription.plan}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="text-emerald-500" />
            <span>Expires: {currentSubscription.endDate}</span>
            <span className="ml-2 text-sm text-orange-500">
              ({daysUntilExpiration()} days remaining)
            </span>
          </div>

          {currentSubscription.previousDiscount && (
            <Alert>
              <AlertDescription>
                Previous discount used: {currentSubscription.previousDiscount}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Renewal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Renew Subscription</CardTitle>
          <CardDescription>Enter your details to renew</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <div className="flex items-center gap-2">
              <Phone className="text-gray-500" />
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
              />
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Discount Code (Optional)</label>
            <Input
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleRenewal}
            disabled={!phone || !amount}
          >
            Renew Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubscriptionRenewal;