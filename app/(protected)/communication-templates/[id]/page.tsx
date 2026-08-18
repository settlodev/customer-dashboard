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
import {
    PageShell,
    PageHeader,
    PageBreadcrumbs,
    PageBody,
} from "@/components/layouts/page-shell";
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

    const title = isNewItem
        ? "Create template"
        : item?.content[0]?.broadcastType || "Edit template";

    return (
        <PageShell>
            <PageBreadcrumbs
                items={[
                    { title: "Communication Templates", href: "/communication-templates" },
                    { title: isNewItem ? "New" : item?.content[0]?.broadcastType || "Edit" },
                ]}
            />
            <PageHeader
                title={title}
                subtitle={
                    isNewItem
                        ? "Add a new communication template for your business location"
                        : "Edit template details"
                }
            />
            <PageBody>
                <TemplateCard isNewItem={isNewItem} item={item?.content[0]} />
            </PageBody>
        </PageShell>
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
