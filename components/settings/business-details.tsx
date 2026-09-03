"use client";

import { Business } from "@/types/business/type";
import BusinessForm from "@/components/forms/business_form";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/loading";
import { PanelHeader } from "@/components/settings/shared/panel-header";
import { IdentifierChip } from "@/components/settings/shared/identifier-chip";

const BusinessDetailsSettings = ({
  business,
  isLoading,
}: {
  business: Business | null;
  isLoading: boolean;
}) => {
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
            <IdentifierChip
              label="Account No:"
              value={business.identifier}
              copyLabel="Copy account number"
            />
          ) : undefined
        }
      />

      <BusinessForm item={business} onSubmit={() => {}} />
    </div>
  );
};

export default BusinessDetailsSettings;
