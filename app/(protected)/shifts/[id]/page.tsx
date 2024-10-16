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
import {ApiResponse} from "@/types/types";
import { Shift } from "@/types/shift/type";
import { getShift } from "@/lib/actions/shift-actions";
import ShiftForm from "@/components/forms/shift_form";

export default async function ShiftPage({params}: {
    params: { id: string };
}) {
    const isNewItem = params.id === "new";
    let item: ApiResponse<Shift> | null = null;

    if (!isNewItem) {
        try {
            item = await getShift(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load role data");
        }
    }

    const breadcrumbItems = [
        { title: "Shifts", link: "/shifts" },
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

            <ShiftCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const ShiftCard = ({isNewItem, item}: {
    isNewItem: boolean;
    item: Shift | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Add shift" : "Edit shift details"}</CardTitle>
            <CardDescription>
                {isNewItem ? "Add shift to your business" : "Edit shift details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ShiftForm item={item} />
        </CardContent>
    </Card>
);