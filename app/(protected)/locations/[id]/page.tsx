import { UUID } from "node:crypto";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLocation } from "@/lib/actions/location-actions";
import { Location } from "@/types/location/type";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import LocationClientForm from "@/components/forms/location_client_form";

type Params = Promise<{ id: string }>;
export default async function LocationPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: Location | null = null;

  if (!isNewItem) {
    try {
      item = await getLocation(resolvedParams.id as UUID);
      if (!item) notFound();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load location data");
    }
  }

  const title = isNewItem ? "Create location" : item?.name || "Edit location";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Locations", href: "/locations" },
          { title: isNewItem ? "New" : item?.name || "Edit" },
        ]}
      />
      <PageHeader
        title={title}
        subtitle={
          isNewItem
            ? "Add a new location to your business"
            : "Edit location details"
        }
      />
      <PageBody>
        <LocationCard isNewItem={isNewItem} item={item} />
      </PageBody>
    </PageShell>
  );
}

const LocationCard = ({
  isNewItem,
  item,
}: {
  isNewItem: boolean;
  item: Location | null | undefined;
}) => (
  <Card>
    <CardHeader>
      {/*<CardTitle>{isNewItem ? "Create location" : "Edit location"}</CardTitle>*/}
      <CardDescription>
        {isNewItem
          ? "Add a new location to your business"
          : "Edit location details"}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <LocationClientForm item={item} />
    </CardContent>
  </Card>
);
