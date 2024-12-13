import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface NoItemsProps {
    newItemUrl: string;
    itemName: string;
}

export default function NoItems({ newItemUrl, itemName}: NoItemsProps) {
    return (
        <div className="h-[calc(100vh-240px)] border border-dashed">
            <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                <h1 className="text-[1.5rem] font-bold leading-tight">
                    No {itemName} data found
                </h1>
                <p className="text-sm text-center text-muted-foreground">
                    There are no {itemName} records found at the moment, add new{" "}
                    {itemName} record to start viewing data.
                </p>

                <div className="mt-6 flex gap-4">
                    <Link
                        className={cn(buttonVariants({ variant: "default" }))}
                        href={newItemUrl}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add {itemName}
                    </Link>
                </div>
            </div>
        </div>
    );
}
