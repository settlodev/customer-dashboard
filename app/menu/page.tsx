'use client';

import ProductMenu from "@/components/widgets/products/product-menu";
export default function MenuPage({ params }: { params: { locationId: string } }) {
  
  console.log("=== MENU PAGE DEBUG ===");
  console.log("Received params:", params);
  console.log("Location ID from params:", params.locationId);
  console.log("Location ID type:", typeof params.locationId);
  console.log("Is location ID defined?", params.locationId !== undefined);
  console.log("========================");

  return <ProductMenu params={params} />;
}