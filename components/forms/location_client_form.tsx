"use client";

import { Location } from "@/types/location/type";
import { LocationForm } from "@/components/forms/location_form";

export default function LocationClientForm({
  item,
}: {
  item: Location | null | undefined;
}) {
  const handleSubmit = () => {
    // Handle form submission
    console.log("Form submitted");
  };

  return <LocationForm item={item} multipleStep onSubmit={handleSubmit} />;
}
