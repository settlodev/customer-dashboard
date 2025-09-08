import { UUID } from "node:crypto";

import { notFound } from "next/navigation";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Staff} from "@/types/staff";
import {ApiResponse} from "@/types/types";
import WarehouseStaffForm from "@/components/forms/warehouse/staff_form";
import { getWarehouseStaff } from "@/lib/actions/warehouse/staff-actions";

type Params = Promise<{ id: string }>;
export default async function StaffPage({params}: {params: Params}) {

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Staff> | null = null;

    if (!isNewItem) {
        try {
            item = await getWarehouseStaff(resolvedParams.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            console.log(error)
            throw new Error("Failed to load staff data");
        }
    }

    const breadcrumbItems = [
        { title: "Staff", link: "/warehouse-staff" },
        {
            title: isNewItem ? "New" : item?.content[0]?.firstName || "Edit",
            link: "",
        },
    ];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-12">
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
            <WarehouseStaffForm item={item} />
        </CardContent>
    </Card>
);
