"use client";
import React from "react";
import { CreditCard, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentIntegrations from "./payment-integrations";
import AccountingIntegrations from "./accounting-integrations";
import { PanelHeader } from "./shared/panel-header";
import {
  settingsTabsListClass,
  settingsTabTriggerClass,
} from "./shared/settings-tabs";

export default function IntegrationsSettings() {
  return (
    <div className="space-y-6">
      <PanelHeader
        title="Integrations"
        description="Connect third-party services to your business."
      />

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className={settingsTabsListClass}>
          <TabsTrigger value="payments" className={settingsTabTriggerClass}>
            <CreditCard className="h-4 w-4 shrink-0" />
            Payment providers
          </TabsTrigger>
          <TabsTrigger value="accounting" className={settingsTabTriggerClass}>
            <BookOpen className="h-4 w-4 shrink-0" />
            Accounting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-6">
          <div className="rounded-xl border border-line bg-card p-4 sm:p-6">
            <PaymentIntegrations />
          </div>
        </TabsContent>

        <TabsContent value="accounting" className="mt-6">
          <div className="rounded-xl border border-line bg-card p-4 sm:p-6">
            <AccountingIntegrations />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
