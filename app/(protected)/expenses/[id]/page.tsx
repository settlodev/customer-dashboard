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
import { Expense } from "@/types/expense/type";
import { getExpense } from "@/lib/actions/expense-actions";
import ExpenseForm from "@/components/forms/expense_form";

type Params = Promise<{id:string}>
export default async function ExpensesPage({params}: {params: Params}) {

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Expense> | null = null;

    if (!isNewItem) {
        try {
            item = await getExpense(resolvedParams.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            console.log(error)
            throw new Error("Failed to load role data");
        }
    }

    const breadcrumbItems = [
        { title: "Expenses", link: "/expenses" },
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

            <ExpenseCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const ExpenseCard = ({isNewItem, item}: {
    isNewItem: boolean;
    item: Expense | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Add expense" : "Edit expense details"}</CardTitle>
            <CardDescription>
                {isNewItem ? "Add expense to your business" : "Edit expense details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ExpenseForm item={item} />
        </CardContent>
    </Card>
);
