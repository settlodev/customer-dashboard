import { UUID } from "node:crypto";

import { notFound } from "next/navigation";
// import { isNotFoundError } from "next/dist/client/components/not-found";

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {ApiResponse} from "@/types/types";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Purchase } from "@/types/warehouse/purchase/type";
import { getPurchase } from "@/lib/actions/warehouse/purchases-action";
import PurchaseForm from "@/components/forms/warehouse/purchase_form";

type Params = Promise<{id:string}>
export default async function PurchasePage({params}: {params: Params}) {


    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Purchase> | null = null;

    if (!isNewItem) {
        try {
            item = await getPurchase(resolvedParams.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            console.log(error)
            // Ignore redirect error
            // if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load purchase data");
        }
    }

    const breadcrumbItems = [
        { title: "Purchase", link: "/purchases" },
        {
            title: isNewItem ? "New" : item?.content[0]?.order_Id || "Edit",
            link: "",
        },
    ];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems} />
                </div>
            </div>

            <PurchaseCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const PurchaseCard = ({item}: { isNewItem: boolean; item: Purchase | null | undefined; }) => (
    <Card>
        <CardContent>
            <PurchaseForm item={item} />
        </CardContent>
    </Card>
);
