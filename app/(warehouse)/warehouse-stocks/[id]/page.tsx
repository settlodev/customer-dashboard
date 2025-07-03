import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Stock } from "@/types/stock/type";
import WarehouseStockForm from "@/components/forms/warehouse/stock_form";
import { getStockFromWarehouse } from "@/lib/actions/warehouse/stock-actions";

type Params = Promise<{id: string}>
export default async function StockItemPage({params}: {params: Params}){

    const paramsData = await params
    const isNewItem = paramsData.id === "new";
    let item: ApiResponse<Stock> | null = null;

    if(!isNewItem){
        try{
            item = await  getStockFromWarehouse(paramsData.id as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            
            console.log(error)
            throw new Error("Failed to load stock details");
        }
    }

    const breadCrumbItems=[{title:"Stocks",link:"/warehouse-stock-variants"},
        {title: isNewItem ? "New":item?.content[0].name || "Edit",link:""}]

    return(
        <div className="flex-1 space-y-12 p-4 md:p-8 pt-12">
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
               {isNewItem ? "Create Stock Item" : "Edit Stock Item"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Create stock items for your warehouse": "Edit stock item details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <WarehouseStockForm item={item}/>
        </CardContent>
    </Card>
)
