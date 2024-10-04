"use client";

import { useRouter } from "next/navigation";
import {Business} from "@/types/business/type";
import Image from "next/image";

import {useEffect, useState} from "react";
import {ChevronRightIcon} from "@nextui-org/shared-icons";

export const SelectBusiness = ({ businesses }: { businesses: Business[]}) => {
    const router = useRouter();
    const [business, setBusiness] = useState(null);

    useEffect(()=>{
        if(businesses.length === 1){
            setBusiness(businesses[0]);
        }
    }, [businesses]);

    if (businesses.length === 0) {
        /*router.push(`/business-registration`);
        return null;*/
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
                        <></>:
                        businesses.map((business: Business, index: number) => {
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
                                                    onClick={() => setBusiness(business)}>
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
        /*<Table>
        <TableCaption>
            A list of all businesses.
        </TableCaption>
        <TableHeader>
            <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Business Type</TableHead>
                <TableHead>Business Phone</TableHead>
                <TableHead>Business Address</TableHead>
                <TableHead>Business Country</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {businesses.map((business) => (
                <TableRow key={business.id}>
                    <TableCell onClick={() => handleRedirectToLocations(business)}
                               style={{cursor: 'pointer'}}>{business.name}</TableCell>
                    <TableCell>{business.businessType}</TableCell>
                    <TableCell>{business.country}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>*/

    )
}
