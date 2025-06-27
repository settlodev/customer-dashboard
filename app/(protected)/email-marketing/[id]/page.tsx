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

    const breadcrumbItems = [
        { title: "Email Marketing", link: "/email-marketing" },
        {
            title: isNewItem ? "New" : item?.content[0]?.subject || "",
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
