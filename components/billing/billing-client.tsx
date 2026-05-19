"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { InvoicesTab } from "./invoices-tab";
import { CreditsTab } from "./credits-tab";
import { PrepayTab } from "./prepay-tab";
import type {
  Addon,
  BillingInvoice,
  CreditBalance,
  CreditPack,
  CreditTransaction,
  Package,
  Subscription,
} from "@/types/billing/types";

interface BillingClientProps {
  subscription: Subscription;
  packages: Package[];
  addons: Addon[];
  invoices: BillingInvoice[];
  totalInvoiceCount: number;
  businessId: string;
  creditBalances: CreditBalance[];
  creditPacks: CreditPack[];
  creditTransactions: CreditTransaction[];
  entityLabels?: Record<string, string>;
  contactDefaults?: { email: string; phone: string };
}

export function BillingClient({
  subscription,
  packages,
  addons,
  invoices,
  totalInvoiceCount,
  businessId,
  creditBalances,
  creditPacks,
  creditTransactions,
  entityLabels,
  contactDefaults,
}: BillingClientProps) {
  const [tab, setTab] = useState("overview");
  const primaryItem = subscription.items.find((i) => i.status === "ACTIVE");

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 sm:inline-grid sm:w-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="renew">Renew</TabsTrigger>
        <TabsTrigger value="invoices">
          Invoices
          {totalInvoiceCount > 0 && (
            <span className="ml-1.5 rounded bg-canvas px-1 font-mono text-[10px] tabular-nums">
              {totalInvoiceCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="credits">Credits</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <OverviewTab
          subscription={subscription}
          packages={packages}
          addons={addons}
          entityLabels={entityLabels}
        />
      </TabsContent>

      <TabsContent value="renew" className="mt-6">
        <PrepayTab
          subscription={subscription}
          primaryItem={primaryItem}
          contactDefaults={contactDefaults}
        />
      </TabsContent>

      <TabsContent value="invoices" className="mt-6">
        <InvoicesTab
          invoices={invoices}
          businessId={businessId}
          locationId={primaryItem?.entityId}
          contactDefaults={contactDefaults}
        />
      </TabsContent>

      <TabsContent value="credits" className="mt-6">
        <CreditsTab
          businessId={businessId}
          balances={creditBalances}
          packs={creditPacks}
          recentTransactions={creditTransactions}
        />
      </TabsContent>
    </Tabs>
  );
}
