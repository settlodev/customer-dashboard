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

    if (business.totalLocations === 0) {
      redirect("/business-location");
    }

    const businessLocations = await fetchAllLocations();

    const warehouseList = await searchWarehouses(q, page, pageLimit);
    const data: Warehouses[] = warehouseList.content;

    if (!businessLocations) {
      redirect("/select-business");
    }

    return (
      <LocationList
        locations={businessLocations || []}
        businessName={business.name}
        warehouses={data}
      />
    );
  } catch (error) {
    console.error("Error in getting current business - logging out:", error);
    redirect("/select-business");
  }
}
