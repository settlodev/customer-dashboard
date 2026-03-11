"use client";

import { Business } from "@/types/business/type";
import BusinessForm from "@/components/forms/business_form";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/loading";

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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Business Details
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your business information, type, and social media links
        </p>
      </div>

      <BusinessForm item={business} onSubmit={() => {}} />
    </div>
  );
};

export default BusinessDetailsSettings;
