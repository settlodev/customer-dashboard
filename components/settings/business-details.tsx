"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Business } from "@/types/business/type";
import BusinessForm from "@/components/forms/business_form";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/loading";
import { Copy, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const BusinessDetailsSettings = ({
  business,
  isLoading,
}: {
  business: Business | null;
  isLoading: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = () => {
    if (!business?.businessAccountNumber) return;
    navigator.clipboard.writeText(business.businessAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Business Details
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Loading business details...
          </p>
        </div>
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-6 flex items-center justify-center">
            <Loading />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Business Details
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your business information, type, and social media links
          </p>
          {business?.businessAccountNumber && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Account No:</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">
                {business.businessAccountNumber}
              </code>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        <Button
          onClick={() => router.push("/business/new")}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Business
        </Button>
      </div>

      <BusinessForm item={business} onSubmit={() => {}} />
    </div>
  );
};

export default BusinessDetailsSettings;
