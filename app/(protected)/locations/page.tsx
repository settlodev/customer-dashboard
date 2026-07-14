import { getLocationById } from "@/lib/actions/location-actions";
import { LocationDetailClient } from "@/components/widgets/location-details";

export default async function Page() {
  const location = await getLocationById();

  return <LocationDetailClient location={location} />;
}
