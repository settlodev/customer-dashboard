import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { StockIntake } from "@/types/stock-intake/type";
import { getStockIntake } from "@/lib/actions/stock-intake-actions";
import StockIntakeForm from "@/components/forms/stock_intake_form";

type Params = Promise<{ stockVariant:string,id:string}>
export default async function StockIntakePage({params}: {params: Params}){

    const paramsData = await params
    const {stockVariant, id} = paramsData
    const isNewItem = id === "new";
    let item: ApiResponse<StockIntake> | null = null;

    if(!isNewItem){
        try{
            item = await getStockIntake(id as UUID, stockVariant as UUID);
            if(item && item.totalElements === 0) notFound();
        }
        catch (error){
            
            throw error;

        }
    }

    const breadCrumbItems=[{title:"Stock Intake",link:"/stock-intakes"},
        {title: isNewItem ? "New":item?.content[0].id || "Edit",link:""}]

    return(
        <div className={`flex-1 space-y-4 p-4 md:p-8 pt-6`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 `}>
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            <StockIntakeCard isNewItem={isNewItem} item={item?.content[0]}/>
        </div>
    )
}

const StockIntakeCard =({isNewItem, item}:{
    isNewItem:boolean,
    item: StockIntake | null | undefined
}) =>(
    <Card className="mt-12" >
       <CardHeader>
           <CardTitle>
               {isNewItem ? "Record Stock Intake" : "Edit stock intake"}
           </CardTitle>
           <CardDescription>
               {isNewItem ? "Record stock intake to your business location": "Edit stock intake details"}
           </CardDescription>
       </CardHeader>
        <CardContent>
            <StockIntakeForm item={item}/>
        </CardContent>
    </Card>
)
