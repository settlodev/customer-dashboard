'use client'
import {UUID} from "node:crypto";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { StockIntake } from "@/types/stock-intake/type";
import { getStockIntake } from "@/lib/actions/stock-intake-actions";
import StockIntakeDetails from "@/components/widgets/stock-intake-details";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "@/app/(protected)/loading";


export default function StockIntakePage({params}:{params:{id:string}}) {
    const [item, setItem] = useState<StockIntake >({} as StockIntake);
    const [loading, setLoading] = useState<boolean>(true);
    const {id} = params;
    const stockVariant = useSearchParams().get("stockVariant");
    
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const fetchedItem = await getStockIntake(id as UUID, stockVariant as UUID);
                setItem(fetchedItem); 
            } catch (error) {
                console.error("Error fetching stock intake:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, stockVariant]);
           
    const breadCrumbItems = [{title: "Stock Intake", link: "/stock-intakes"}]

    if (loading) {
        return <div>
            <Loading/>
        </div>; // Optional loading state
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1">
                    <BreadcrumbsNav items={breadCrumbItems}/>
                </div>
            </div>
            
            <StockIntakeDetails item={item} />
        </div>
    )
}