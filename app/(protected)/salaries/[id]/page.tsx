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
import {ApiResponse} from "@/types/types";
import { Salary } from "@/types/salary/type";
import { getSalary } from "@/lib/actions/salary-actions";
import SalaryForm from "@/components/forms/salary_form";

type Params = Promise<{ id: string}>
export default async function SalaryPage ({params}: {params: Params}) {

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Salary> | null = null;

    if (!isNewItem) {
        try {
            item = await getSalary(resolvedParams.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            console.log(error)

            throw new Error("Failed to load salary data");
        }
    }

    const breadcrumbItems = [
        { title: "Salary", link: "/salaries" },
        {
            title: isNewItem ? "New" : item?.content[0]?.amount.toString() || "Edit",
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

            <SalaryCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const SalaryCard = ({isNewItem, item}: {
    isNewItem: boolean;
    item: Salary | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Add salary details" : "Edit salary details"}</CardTitle>
            <CardDescription>
                {isNewItem ? "Add shift to your business" : "Edit shift details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SalaryForm item={item} />
        </CardContent>
    </Card>
);
