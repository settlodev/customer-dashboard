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
import { ApiResponse } from "@/types/types";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import SMSEMAILForm from "@/components/forms/sms_email_form";
import { SMS } from "@/types/sms/type";
import { getSMS } from "@/lib/actions/broadcast-sms-action";

export default async function SMSMarketingPage({params}: {params: { id: string }}) {

    const isNewItem = params.id === "new";
    let item: ApiResponse<SMS> | null = null;

    if (!isNewItem) {
        try {
            item = await getSMS(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load template data");
        }
    }

    const breadcrumbItems = [
        { title: "SMS Marketing", link: "/sms-marketing" },
        {
            title: isNewItem ? "New" : item?.content[0]?.senderId || "",
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
    item: SMS | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Send SMS/Email" : "Edit template"}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Broadcast SMS / Email for your business location towards your customers or staff"
                    : "Edit template details"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SMSEMAILForm item={item} />
        </CardContent>
    </Card>
);
