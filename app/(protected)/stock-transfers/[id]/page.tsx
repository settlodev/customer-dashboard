import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { StockTransfer } from "@/types/stock-transfer/type";
import { getStockTransferred } from "@/lib/actions/stock-transfer-actions";
import StockTransferForm from "@/components/forms/stock_transfer_form";

type Params = Promise<{stockVariant:string,id:string}>
export default async function StockTransferPage({params}: {params: Params}){

    const paramsData = await params
    const {stockVariant, id} = paramsData
    const isNewItem = id === "new";
    let item: ApiResponse<StockTransfer> | null = null;

    if(!isNewItem){
        try{
            item = await  getStockTransferred(id as UUID,stockVariant as UUID);
            if(item.totalElements == 0) notFound();
        }
        catch (error){
            console.log(error)
            throw new Error("Failed to load stock transfer details");
        }
    }

    const breadCrumbItems=[{title:"Stock Transfer",link:"/stock-transfers"},
        {title: isNewItem ? "New":item?.content[0].id || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <StockTransferCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const StockTransferCard =({isNewItem, item}:{
    isNewItem:boolean,
    item: StockTransfer | null | undefined
}) =>(
    <Card>
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Transfer Stock " : ""}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Transfer stock to your business location": ""}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <StockTransferForm item={item}/>
        </CardContent>
    </Card>
)
