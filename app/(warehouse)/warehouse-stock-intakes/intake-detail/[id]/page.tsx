'use client'
import {UUID} from "node:crypto";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { StockIntake } from "@/types/stock-intake/type";
import StockIntakeDetails from "@/components/widgets/stock-intake-details";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "@/app/(protected)/loading";
import { getStockIntakeFromWarehouse } from "@/lib/actions/warehouse/stock-intake-actions";

type Params = Promise<{
    id: string;
}>

export default function StockIntakePage({ params }: { params: Params }) {
    const [item, setItem] = useState<StockIntake>({} as StockIntake);
    const [loading, setLoading] = useState<boolean>(true);
    const [id, setId] = useState<string>("");
    const stockVariant = useSearchParams().get("stockVariant");
    
    // Resolve params first
    useEffect(() => {
        const resolveParams = async () => {
            const resolvedParams = await params;
            setId(resolvedParams.id);
        };
        
        resolveParams();
    }, [params]);
    
    useEffect(() => {
        if (!id) return; // Don't fetch until we have the id
        
        const fetchData = async () => {
            setLoading(true);
            try {
                const fetchedItem = await getStockIntakeFromWarehouse(id as UUID, stockVariant as UUID);
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