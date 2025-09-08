

import ProductDetailsPageWrapper from "@/components/site/product-detail-wrapper";


type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ProductPage({searchParams}: {searchParams: SearchParams}) {
  const searchParamsObj = await searchParams;
  

  let product = null;
  
  if (searchParamsObj?.product) {
    try {
      const productData = decodeURIComponent(searchParamsObj.product as string);
      product = JSON.parse(productData);
    } catch (error) {
      console.error('Error parsing product data from URL:', error);
    }
  }
  
  
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