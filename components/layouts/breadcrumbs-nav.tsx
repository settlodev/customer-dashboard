"use client";

import React from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type BreadcrumbItemType = {
    title: string;
    link: string;
};

type BreadcrumbPropsType = {
    items: BreadcrumbItemType[];
};

export default function BreadcrumbsNav({ items }: BreadcrumbPropsType) {
    return (
        <>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink key="dashboard" href={`/dashboard`}>Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />

                    {items.map((item, index) => (
                        <>
                        <BreadcrumbItem key={index}>
                            <BreadcrumbLink key={index} href={item.link}>
                                {item.title}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        </>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        </>
    );
}
