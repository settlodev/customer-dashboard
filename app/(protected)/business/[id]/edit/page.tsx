import Link from "next/link";

import { Button } from "@/components/ui/button";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import {getBusiness} from "@/lib/actions/business/get";
import {Business} from "@/types/business/type";
import BusinessRegistrationForm from "@/components/forms/business_registration_form";

export default async function EditPage({ params }: { params: { id: string }}) {
    const isNewItem = params.id === "new";
    let item: Business = null!;

    if (!isNewItem) {
        try {
            item = await getBusiness(params.id as UUID);
            if (!item) notFound();
        } catch (error) {
            // Ignore redirect error
            if (isNotFoundError(error)) throw error;

            throw new Error("Failed to load data");
        }
    }
    console.log("item is now: ", item);

    const breadcrumbItems = [
        {title: "Business", link: "/business"},
        {
            title: isNewItem ? "New" : item?.name || "Edit",
            link: "",
        },
    ];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems}/>
                </div>

                <div className="flex items-center space-x-2">
                    <Button>
                        <Link key="add-space" href={`/location/create`}>Add Location</Link>
                    </Button>
                </div>
            </div>

            {item?
                <BusinessRegistrationForm business={item} />:
                <div>Business not found</div>
            }
        </div>
    );
}
