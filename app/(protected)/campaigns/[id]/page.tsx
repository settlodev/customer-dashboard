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
import { Campaign} from "@/types/campaign/type";
import { getCampaign} from "@/lib/actions/campaign_action";
import CampaignForm from "@/components/forms/campaign_form";

type Params = Promise<{ id: string }>;
export default async function SMSMarketingPage({params}: {params: Params}) {

    const resolvedParams = await params;
    const isNewItem = resolvedParams.id === "new";
    let item: ApiResponse<Campaign> | null = null;

    if (!isNewItem) {
        try {
            item = await getCampaign(resolvedParams.id as UUID);
            if (item.totalElements == 0) notFound();
        } catch (error) {

            console.log(error)
            throw new Error("Failed to load template data");
        }
    }

    const title = isNewItem ? "New campaign" : item?.content[0]?.name || "Campaign";

    return (
        <PageShell>
            <PageBreadcrumbs
                items={[
                    { title: "Campaign", href: "/campaign" },
                    { title: isNewItem ? "New" : item?.content[0]?.name || "" },
                ]}
            />
            <PageHeader
                title={title}
                subtitle={
                    isNewItem
                        ? "Broadcast Campaign towards your customers or staff"
                        : undefined
                }
            />
            <PageBody>
                <CampaignCard isNewItem={isNewItem} item={item?.content[0]} />
            </PageBody>
        </PageShell>
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
