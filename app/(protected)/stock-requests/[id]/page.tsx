import {UUID} from "node:crypto";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { getStockRequest } from "@/lib/actions/request-actions";
import { StockRequests } from "@/types/warehouse/purchase/request/type";
import StockRequestForm from "@/components/forms/stock_request_form";

type Params = Promise<{id:string}>
export default async function StockRequestPage({params}: {params: Params}){

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item = null;

    if(!isNewItem){
        try{
            item = await  getStockRequest(resolvedParams.id as UUID);
            
        }
        catch (error){
            console.log(error)
            throw new Error("Failed to load stock request details");
        }
    }

    const breadCrumbItems=[{title:"Stock Requests",link:"/stock-requests"},
        {title: isNewItem ? "New":item?.warehouseStockVariantName || "Edit",link:"/stock-requests/new"}
    ]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <StockRequestCard isNewItem={isNewItem} item={item}/>
        </div>
    )
}

const StockRequestCard =({isNewItem,item}:{
    isNewItem:boolean,
    item: StockRequests
}) =>(
    <Card>
        <CardContent>
            <StockRequestForm item={item}/>
        </CardContent>
    </Card>
)
