import { UUID } from "node:crypto";

import { notFound } from "next/navigation";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PageShell, PageHeader, PageBreadcrumbs, PageBody } from "@/components/layouts/page-shell";
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

    return (
        <PageShell>
            <PageBreadcrumbs
                items={[
                    { title: "Salaries", href: "/salaries" },
                    { title: isNewItem ? "New" : item?.content[0]?.amount.toString() || "Edit" },
                ]}
            />
            <PageHeader title={isNewItem ? "Add salary" : "Edit salary"} />
            <PageBody>
                <SalaryCard isNewItem={isNewItem} item={item?.content[0]} />
            </PageBody>
        </PageShell>
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
