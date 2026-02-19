import { ApiResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDevice } from "@/lib/actions/devices-actions";
import { Device } from "@/types/device/type";
import DeviceForm from "@/components/forms/device_form";

type Params = Promise<{ id: string }>;
export default async function DevicePage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: ApiResponse<any> | null = null;

  if (!isNewItem) {
    try {
      item = await getDevice(resolvedParams.id as UUID);
      if (item.totalElements == 0) notFound();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load discount details");
    }
  }

  const breadCrumbItems = [
    { title: "Linked Devices", link: "/devices" },
    { title: isNewItem ? "New" : item?.content[0].name || "Edit", link: "" },
  ];

  return (
    <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
      <div className={`flex items-center justify-between mb-2`}>
        <div className={`relative flex-1 `}>
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
      </div>
      <DeviceCard isNewItem={isNewItem} item={item?.content[0]} />
    </div>
  );
}
const DeviceCard = ({
  isNewItem,
  item,
}: {
  isNewItem: boolean;
  item: Device | null | undefined;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{isNewItem ? "Add Device" : "Edit device details"}</CardTitle>
      <CardDescription>
        {isNewItem
          ? "Add device to your location(branch)"
          : "Edit device details"}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <DeviceForm item={item} />
    </CardContent>
  </Card>
);
