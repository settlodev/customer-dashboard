'use client';

import ProductMenuContent from "@/components/widgets/products/product-menu";
import { CartProvider } from "@/context/cartProvider";

type Params = Promise<{ id: string }>;
export default async function MenuPage({ params }: { params: Params }) {

  const resolvedParams = await params;

  return (
    <CartProvider>
      <ProductMenuContent params={resolvedParams} />
    </CartProvider>
  );
}

