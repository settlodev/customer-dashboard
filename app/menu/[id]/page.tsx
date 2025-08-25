import ProductMenu from "@/components/widgets/products/product-menu";
import { CartProvider } from "@/context/cartContext";

type Params = Promise<{ id: string }>;

export default async function MenuPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  
  return (
    <CartProvider>
      <ProductMenu params={resolvedParams} />
    </CartProvider>
  );
}