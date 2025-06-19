import { UUID } from "node:crypto";

import { notFound } from "next/navigation";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ApiResponse } from "@/types/types";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Template } from "@/types/communication-templates/types";
import { getTemplate } from "@/lib/actions/communication-templates-actions";
import TemplateForm from "@/components/forms/communication_template_form";


type Params = Promise<{id: string}>
export default async function TemplatePage({params}: {params: Params}) {

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Template> | null = null;

    if (!isNewItem) {
        try {
            item = await getTemplate(resolvedParams.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            console.log(error)
            throw new Error("Failed to load template data");
        }
    }

    const breadcrumbItems = [
        { title: "Communication Templates", link: "/communication-templates" },
        {
            title: isNewItem ? "New" : item?.content[0]?.broadcastType || "Edit",
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

            <TemplateCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const TemplateCard = ({
    isNewItem, item,}: {
    isNewItem: boolean;
    item: Template | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Create template" : "Edit template"}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Add a new communication template for your business location"
                    : "Edit template details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <TemplateForm item={item} />
        </CardContent>
    </Card>
);
