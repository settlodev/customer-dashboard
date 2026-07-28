"use client";
import React from "react";
import { CreditCard, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentIntegrations from "./payment-integrations";
import AccountingIntegrations from "./accounting-integrations";

export default function IntegrationsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Integrations
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect third-party services to your business
        </p>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="flex w-full max-w-md bg-primary/10 dark:bg-gray-800 rounded-lg p-1">
          <TabsTrigger
            value="payments"
            className="flex-1 gap-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            Payment Providers
          </TabsTrigger>
          <TabsTrigger
            value="accounting"
            className="flex-1 gap-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            Accounting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <PaymentIntegrations />
          </div>
        </TabsContent>

        <TabsContent value="accounting" className="mt-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <AccountingIntegrations />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
