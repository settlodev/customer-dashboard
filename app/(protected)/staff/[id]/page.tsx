import { UUID } from "node:crypto";

import { notFound } from "next/navigation";
import { isNotFoundError } from "next/dist/client/components/not-found";

import StaffForm from "@/components/forms/staff-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layout/breadcrumbs-nav";
import { getStaff } from "@/lib/actions/staff-actions";
import {Staff} from "@/types/staff";
import {ApiResponse} from "@/types/types";

export default async function StaffPage({
                                            params,
                                        }: {
    params: { id: string };
}) {
    const isNewItem = params.id === "new";
    let item: ApiResponse<Staff> | null = null;

    if (!isNewItem) {
        try {
            item = await getStaff(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load product data");
        }
    }

    const breadcrumbItems = [
        { title: "Staff", link: "/staff" },
        {
            title: isNewItem ? "New" : item?.content[0]?.firstName || "Edit",
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

            <StaffCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const StaffCard = ({isNewItem, item}: {
    isNewItem: boolean;
    item: Staff | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Add staff" : "Edit staff details"}</CardTitle>
            <CardDescription>
                {isNewItem ? "Add staff to your business" : "Edit staff details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <StaffForm item={item} />
        </CardContent>
    </Card>
);
