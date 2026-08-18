'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Location } from "@/types/location/type";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";

type BreadcrumbItemType = {
    title: string;
    link: string;
};

type BreadcrumbPropsType = {
    items: BreadcrumbItemType[];
};

export default function BreadcrumbsNav({ items }: BreadcrumbPropsType) {
    const [location, setLocation] = useState<Location | null | undefined >(null);
    const [warehouse, setWarehouse] = useState<Warehouses | null | undefined>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {

                const [locationData, warehouseData] = await Promise.all([
                    getCurrentLocation(),
                    getCurrentWarehouse()
                ]);

                setLocation(locationData);
                setWarehouse(warehouseData);
            } catch (error) {
                console.error("Error fetching location or warehouse data:", error);
                setLocation(null);
                setWarehouse(null);
            }
        };

        fetchData();
    }, []);

    const getHomeLink = () => {
        if (location) {
            return "/dashboard";
        }
        else if (warehouse) {
            return "/warehouse";
        }
        else {
            return "/select-business";
        }
    };

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href={getHomeLink()}>Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {items.map((item) => (
                    <React.Fragment key={item.link}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={item.link}>
                                    {item.title}
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}


