"use client";

import {Business} from "@/types/business/type";
import Image from "next/image";
import {useEffect, useState} from "react";
import {ChevronRightIcon} from "@nextui-org/shared-icons";
import {SelectLocation} from "@/app/(verification)/select-business/locations_dropdown";
import {refreshBusiness} from "@/lib/actions/business/refresh";

export const SelectBusiness = ({ businesses }: { businesses: Business[]}) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const [business, setBusiness] = useState<Business>(null);

    useEffect(()=>{
        if(businesses.length === 1){
            setBusiness(businesses[0]);
        }
    }, [businesses]);

    if (businesses.length === 0) {
        /*router.push(`/business-registration`);
        return null;*/
    }

    const setCurrentBusiness = async(mBusiness: Business)=>{
        setBusiness(mBusiness);
        await refreshBusiness(mBusiness);
    }

    return (<div>
            <div className="flex items-center justify-center flex-col">
                <div className="overflow-hidden rounded-full bg-emerald-400 p-2 m-4">
                    <Image src="/images/logo.png" alt="Settlo Logo" width={50} height={50}/>
                </div>
                <div className="overflow-hidden m-4">
                    <h1 className="font-bold">Select your business {business && 'location'}</h1>
                </div>
            </div>

            <div className="flex items-center justify-center">
                <div className="rounded border-1 border-gray-200">
                    <ul className="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
                        {business?
                            //TODO: Display in separate locations component
                            <SelectLocation locations={business.allLocations} />
                        : businesses.map((business: Business, index: number) => {
                                //TODO: Display in separate businesses component
                                return <li className="pb-3 sm:pb-4 p-4" key={index}>
                                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                        <div className="flex-shrink-0 w-10 h-10 p-1 rounded-full bg-emerald-400">
                                            <Image className="rounded-full" src="/images/logo.png" alt="Settlo Logo"
                                                   width={50} height={50}/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate dark:text-white">
                                                {business.name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                                {business.countryName}
                                            </p>
                                        </div>
                                        <div
                                            className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                            <button type="button"
                                                    className="flex gap-2 rounded-full bg-emerald-500 pr-2 pl-3 py-1 text-white font-medium text-sm"
                                                    onClick={() => setCurrentBusiness(business)}>
                                                Select <ChevronRightIcon/>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            }
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
