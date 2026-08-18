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
import EmailForm from "@/components/forms/email_form";
import { Email } from "@/types/email/type";
import { getEmail } from "@/lib/actions/broadcast-email-action";

type Params = Promise<{ id: string}>
export default async function EmailMarketingPage({params}: {params: Params}) {

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Email> | null = null;

    if (!isNewItem) {
        try {
            item = await getEmail(resolvedParams.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            console.log(error)
            throw new Error("Failed to load template data");
        }
    }

    const title = isNewItem ? "Send Email" : item?.content[0]?.subject || "Email";

    return (
        <PageShell>
            <PageBreadcrumbs
                items={[
                    { title: "Email Marketing", href: "/email-marketing" },
                    { title: isNewItem ? "New" : item?.content[0]?.subject || "" },
                ]}
            />
            <PageHeader
                title={title}
                subtitle={
                    isNewItem
                        ? "Broadcast Email from your business location towards your customers"
                        : undefined
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
    item: Email | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Send Email" : ""}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Broadcast Email from your business location towards your customers"
                    : ""}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <EmailForm item={item} />
        </CardContent>
    </Card>
);
