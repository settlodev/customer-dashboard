import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import LocationList from "@/app/(auth)/select-location/location-list";
import { fetchAllLocations } from "@/lib/actions/location-actions";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { searchWarehouses } from "@/lib/actions/warehouse/list-warehouse";
import { Warehouses } from "@/types/warehouse/warehouse/type";

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
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit) || 1000;

  try {
    // Force dynamic behavior by reading headers and cookies
    headers();
    cookies();

    const business = await getCurrentBusiness();

    if (!business) {
      redirect("/select-business");
    }

    // Business exists, continue to fetch locations

    const [businessLocations, warehouseList] = await Promise.all([
      fetchAllLocations(),
      searchWarehouses(),
    ]);

    const warehouses: Warehouses[] = warehouseList || [];

    if (!businessLocations || businessLocations.length === 0) {
      redirect("/business-location");
    }

    // Pass all data to client component — auto-select logic runs there
    // where server actions can properly set cookies.
    return (
      <LocationList
        locations={businessLocations}
        businessName={business.name}
        warehouses={warehouses}
      />
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      (error as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("Error in select-location:", error);
    redirect("/select-business");
  }
}
