import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { AlertTriangle } from "lucide-react";

import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import LocationList from "@/app/(auth)/select-location/location-list";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { getWarehouses } from "@/lib/actions/warehouse/list-warehouse";
import { fetchAllStores } from "@/lib/actions/store-actions";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { Store } from "@/types/store/type";
import RetryButton from "@/app/(auth)/select-business/retry-button";
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function SelectLocationPage({ searchParams }: Params) {
  // Pulled before the try so dynamic mode is established even if a
  // later step throws.
  await searchParams;
  headers();
  cookies();

  // Resolve the business first — without it we can't know which
  // locations to fetch. Redirect to /select-business is correct
  // here because we genuinely don't have a business context.
  let business: Awaited<ReturnType<typeof getCurrentBusiness>>;
  try {
    business = await getCurrentBusiness();
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    Sentry.captureException(error);
    return <SelectLocationErrorState />;
  }

  if (!business) {
    redirect("/select-business");
  }

  // Locations + warehouses + stores fan-out, every list scoped to the
  // *selected* business. A warehouse/store-service hiccup must not block
  // location loading — settle them independently.
  const [locationsResult, warehousesResult, storesResult] =
    await Promise.allSettled([
      fetchAllLocations(business.id),
      getWarehouses(business.id),
      fetchAllStores(business.id),
    ]);

  if (locationsResult.status === "rejected") {
    const reason = locationsResult.reason;
    if (
      reason instanceof Error &&
      "digest" in reason &&
      typeof (reason as { digest?: unknown }).digest === "string" &&
      (reason as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw reason;
    }

    Sentry.captureException(reason);
    return <SelectLocationErrorState />;
  }

  const businessLocations = locationsResult.value;
  const warehouses: Warehouses[] =
    warehousesResult.status === "fulfilled" ? warehousesResult.value : [];
  const stores: Store[] =
    storesResult.status === "fulfilled" ? storesResult.value : [];

  // Confirmed empty — user has a business but no locations yet, so
  // sending them to /business-location is the correct next step.
  if (businessLocations.length === 0) {
    redirect("/business-location");
  }

  // Pass all data to client component — auto-select logic runs there
  // where server actions can properly set cookies. Warehouse/store tabs
  // only appear when those lists are non-empty.
  return (
    <LocationList
      locations={businessLocations}
      businessName={business.name}
      warehouses={warehouses}
      stores={stores}
    />
  );
}

function SelectLocationErrorState() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Alert tone="danger" variant="soft">
        <AlertIcon>
          <AlertTriangle className="h-3.5 w-3.5" />
        </AlertIcon>
        <AlertBody>
          <AlertTitle>We couldn&apos;t load your locations</AlertTitle>
          <AlertDescription>
            Something went wrong reaching our servers. Your account is fine —
            please try again in a moment.
          </AlertDescription>
          <div className="pt-2">
            <RetryButton />
          </div>
        </AlertBody>
      </Alert>
    </div>
  );
}
