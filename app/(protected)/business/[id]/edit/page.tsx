import { UUID } from "node:crypto";

import { notFound } from "next/navigation";
import { isNotFoundError } from "next/dist/client/components/not-found";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {ApiResponse} from "@/types/types";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";

import {Business} from "@/types/business/type";
import UpdateBusinessForm from "@/components/forms/update_business_form";
import {getBusiness} from "@/lib/actions/business-actions";

export default async function Page({params}: { params: { id: string }; }) {
    const isNewItem = params.id === "new";
    let item: ApiResponse<Business> | null = null;

    if (!isNewItem) {
        try {
            item = await getBusiness(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load category data");
        }
    }

    const breadcrumbItems = [
        { title: "Categories", link: "/categories" },
        {
            title: isNewItem ? "New" : item?.content[0]?.name || "Edit",
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

            <BranchCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const BranchCard = ({isNewItem, item}: { isNewItem: boolean; item: Business | null | undefined; }) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Create category" : "Edit category"}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Add a new category to your business"
                    : "Edit category details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <UpdateBusinessForm item={item} />
        </CardContent>
    </Card>
);
