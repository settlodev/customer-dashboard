"use client";

import { useState } from "react";
import { Business } from "@/types/business/type";
import BusinessForm from "@/components/forms/business_form";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/loading";
import { PanelHeader } from "@/components/settings/shared/panel-header";
import { Copy, Check } from "lucide-react";

const BusinessDetailsSettings = ({
  business,
  isLoading,
}: {
  business: Business | null;
  isLoading: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!business?.identifier) return;
    navigator.clipboard.writeText(business.identifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PanelHeader
          title="Business Details"
          description="Loading business details…"
        />
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="flex items-center justify-center p-6">
            <Loading />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Business Details"
        description="Manage your business identity, contact details, logo and registered address."
        meta={
          business?.identifier ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Account No:</span>
              <code className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-ink">
                {business.identifier}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy account number"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-pos" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ) : undefined
        }
      />

      <BusinessForm item={business} onSubmit={() => {}} />
    </div>
  );
};

export default BusinessDetailsSettings;
