'use client';

import ProductMenu from "@/components/widgets/products/product-menu";
export default function MenuPage({ params }: { params: { id: string } }) {
  return <ProductMenu params={params} />;
}