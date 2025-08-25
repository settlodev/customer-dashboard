

import ProductDetailsPageWrapper from "@/components/site/product-detail-wrapper";
import { getProduct } from "@/lib/actions/product-actions";
import { UUID } from "crypto";

type Params = Promise<{id: string}>
export default async function ProductPage({params}: {params: Params}) {
  const paramId = await params;
  const productResponse = await getProduct(paramId?.id as UUID);
  
  const product = productResponse?.content?.[0];
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600">The product you&aposare looking for doesn&apost exist.</p>
        </div>
      </div>
    );
  }
 
  const extendedProduct = {
    ...product,
    price: product.variants?.[0]?.price || "0"
  };

  return (
    <ProductDetailsPageWrapper
      product={extendedProduct}
    />
  );
}