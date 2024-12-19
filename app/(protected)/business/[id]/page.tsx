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
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Business } from "@/types/business/type";
import BusinessForm from "@/components/forms/business_form";
import { getSingleBusiness } from "@/lib/actions/business-actions";

export default async function Page({params}: { params: { id: string }; }) {
    const isNewItem = params.id === "new";
    let item: Business | null = null;

    if (!isNewItem) {
        try {
            item = await getSingleBusiness(params.id as UUID);
            if (!item) notFound();
        } catch (error) {
            if (isNotFoundError(error)) throw error;
            throw new Error("Failed to load business data");
        }
    }

    const breadcrumbItems = [
        { title: "Business", link: "/business" },
        {
            title: isNewItem ? "New" : item?.name || "Edit",
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

            <BusinessCard isNewItem={isNewItem} item={item} />
        </div>
    );
}

const BusinessCard = ({isNewItem, item}: { isNewItem: boolean; item: Business | null | undefined; }) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Create business" : "Edit business"}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Add a new business to your account"
                    : "Edit business details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <BusinessForm item={item} />
        </CardContent>
    </Card>
);