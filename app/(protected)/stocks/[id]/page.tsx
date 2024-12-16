import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Stock } from "@/types/stock/type";
import { getStock } from "@/lib/actions/stock-actions";
import StockForm from "@/components/forms/stock_form";

export default async function StockItemPage({params}:{params:{id:string}}){
    const isNewItem = params.id === "new";
    let item: ApiResponse<Stock> | null = null;

    if(!isNewItem){
        try{
            item = await  getStock(params.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            if(isNotFoundError(error)) throw error;

            throw new Error("Failed to load product details");
        }
    }

    const breadCrumbItems=[{title:"Stocks",link:"/stocks"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <StockCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const StockCard =({isNewItem, item}:{
    isNewItem:boolean,
    item: Stock | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Add Stock" : "Edit Stock"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Add stock items to your business location": "Edit stock details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <StockForm item={item}/>
        </CardContent>
    </Card>
)
