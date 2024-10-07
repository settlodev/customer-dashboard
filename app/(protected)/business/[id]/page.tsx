import Link from "next/link";

import { Button } from "@/components/ui/button";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {UUID} from "node:crypto";
import {notFound} from "next/navigation";
import {isNotFoundError} from "next/dist/client/components/not-found";
import {getBusiness} from "@/lib/actions/business/get";
import {Business} from "@/types/business/type";
import {FacebookIcon, InstagramIcon, TwitterIcon} from "lucide-react";

export default async function BusinessPage({ params }: { params: { id: string }}) {
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
                <div className="bg-white overflow-hidden shadow rounded-lg border">
                        <div className="px-4 py-5 sm:px-6 flex">
                            <div className="flex-1">
                                <h3 className="text-xl leading-6 text-gray-900 font-bold">
                                    {item.name}
                                </h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                    {item.description}
                                </p>
                                <div className="flex pt-2">
                                    <span className="pr-2"><TwitterIcon className="text-blue-400" /></span>
                                    <span className="pr-2"><FacebookIcon className="text-blue-700" /></span>
                                    <span className="pr-2"><InstagramIcon className="text-orange-800" /></span>
                                </div>
                            </div>
                            <div className="float-end">
                                <span className="rounded-full bg-emerald-50 border-emerald-400 border-1 pl-3 pr-3 font-bold text-medium pt-1 pb-1 capitalize">{item.businessType.toLowerCase()}</span>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-gray-200">
                                <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Country
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {item.countryName}
                                    </dd>
                                </div>
                                <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Locations
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {item.allLocations.length} locations
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>: <div>Business not found</div>}
        </div>
    );
}
