'use client';

import ProductMenu from "@/components/widgets/products/product-menu";

type Params = Promise<{ id: string }>;
export default async function MenuPage({ params }: { params: Params }) {

  const resolvedParams = await params;
  return <ProductMenu params={resolvedParams} />;
}