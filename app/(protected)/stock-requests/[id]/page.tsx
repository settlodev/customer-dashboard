import {UUID} from "node:crypto";
import { PageShell, PageHeader, PageBreadcrumbs, PageBody } from "@/components/layouts/page-shell";
import {Card, CardContent} from "@/components/ui/card";
import { getStockRequest } from "@/lib/actions/request-actions";
import { StockRequests } from "@/types/stock-request/type";
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

    return(
        <PageShell>
            <PageBreadcrumbs
                items={[
                    { title: "Stock Requests", href: "/stock-requests" },
                    { title: isNewItem ? "New" : item?.warehouseStockVariantName || "Edit" },
                ]}
            />
            <PageHeader title={isNewItem ? "Request stock" : "Edit stock request"} />
            <PageBody>
                <StockRequestCard isNewItem={isNewItem} item={item}/>
            </PageBody>
        </PageShell>
    )
}

const StockRequestCard =({item}:{
    isNewItem?:boolean,
    item: StockRequests
}) =>(
    <Card>
        <CardContent>
            <StockRequestForm item={item}/>
        </CardContent>
    </Card>
)
