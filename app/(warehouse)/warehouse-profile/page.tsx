import { redirect } from "next/navigation";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";

export default async function Page() {
  const warehouse = await getCurrentWarehouse();
  if (warehouse?.id) redirect(`/warehouse-profile/${warehouse.id}`);
  return <p>No warehouse selected.</p>;
}
