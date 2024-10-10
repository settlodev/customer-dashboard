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
import { Expense } from "@/types/expense/type";
import { getExpense } from "@/lib/actions/expense-actions";
import ExpenseForm from "@/components/forms/expense_form";
import { Department } from "@/types/department/type";
import { getDepartment } from "@/lib/actions/department-actions";
import DepartmentForm from "@/components/forms/department_form";

export default async function DepartmentPage({params}: {
    params: { id: string };
}) {
    const isNewItem = params.id === "new";
    let item: ApiResponse<Department> | null = null;

    if (!isNewItem) {
        try {
            item = await getDepartment(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load department data");
        }
    }

    const breadcrumbItems = [
        { title: "Departments", link: "/departments" },
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

            <DepartmentCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const DepartmentCard = ({isNewItem, item}: {
    isNewItem: boolean;
    item: Department | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Add department" : "Edit department details"}</CardTitle>
            <CardDescription>
                {isNewItem ? "Add department to your business location" : "Edit department details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <DepartmentForm item={item} />
        </CardContent>
    </Card>
);
