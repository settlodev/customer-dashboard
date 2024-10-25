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
import { Campaign} from "@/types/campaign/type";
import { getCampaign} from "@/lib/actions/campaign_action";
import CampaignForm from "@/components/forms/campaign_form";

export default async function SMSMarketingPage({params}: {params: { id: string }}) {

    const isNewItem = params.id === "new";
    let item: ApiResponse<Campaign> | null = null;

    if (!isNewItem) {
        try {
            item = await getCampaign(params.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load template data");
        }
    }

    const breadcrumbItems = [
        { title: "Campaign", link: "/campaign" },
        {
            title: isNewItem ? "New" : item?.content[0]?.name || "",
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

            <CampaignCard isNewItem={isNewItem} item={item?.content[0]} />
        </div>
    );
}

const CampaignCard = ({
    isNewItem, item,}: {
    isNewItem: boolean;
    item: Campaign | null | undefined;
}) => (
    <Card>
        <CardHeader>
            <CardTitle>{isNewItem ? "Send Campaign" : ""}</CardTitle>
            <CardDescription>
                {isNewItem
                    ? "Broadcast Campaign towards your customers or staff"
                    : ""}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <CampaignForm item={item} />
        </CardContent>
    </Card>
);
