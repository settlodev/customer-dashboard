import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Product} from "@/types/product/type";
import ProductForm from "@/components/forms/product_form";
import {getProduct} from "@/lib/actions/product-actions";

export default async function ProductPage({params}:{params:{id:string}}){

    const isNewItem = params.id === "new";
    let item: ApiResponse<Product> | null = null;

    if(!isNewItem){
        try{
            item = await  getProduct(params.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            if(isNotFoundError(error)) throw error;
        }
    }

    const breadCrumbItems=[{title:"Products",link:"/products"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-12">
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <ProductCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const ProductCard =({isNewItem, item}:{
    isNewItem:boolean,
    item: Product | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Product" : "Edit product details"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add product to your business": "Edit product details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <ProductForm item={item}/>
        </CardContent>
    </Card>
)
