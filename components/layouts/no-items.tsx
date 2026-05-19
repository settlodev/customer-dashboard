import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface NoItemsProps {
  newItemUrl: string;
  itemName: string;
}

export default function NoItems({ newItemUrl, itemName }: NoItemsProps) {
  return (
    <div className="min-h-[calc(100vh-240px)] border border-dashed rounded-md">
      <div className="m-auto flex h-full min-h-[calc(100vh-240px)] w-full flex-col items-center justify-center gap-2 px-4 py-12 text-center">
        <h1 className="text-xl sm:text-2xl font-bold leading-tight dark:text-black-2">
          No {itemName} data found
        </h1>
        <p className="text-sm text-muted-foreground dark:text-black-2 max-w-xs sm:max-w-sm">
          There are no {itemName} records found at the moment. Add a new{" "}
          {itemName} record to start viewing data.
        </p>

        <div className="mt-6">
          <Link
            className={cn(buttonVariants({ variant: "default" }))}
            href={newItemUrl}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {itemName}
          </Link>
        </div>
      </div>
    </div>
  );
}
