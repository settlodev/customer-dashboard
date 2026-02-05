import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@react-email/components";

// Alternative approach - always render a Button that either navigates or triggers modal
interface NoItemsProps {
  newItemUrl?: string;
  itemName: string;
  onCreateNew?: () => void;
}

export default function NoItems({
  newItemUrl,
  itemName,
  onCreateNew,
}: NoItemsProps) {
  const handleClick = () => {
    if (onCreateNew) {
      onCreateNew();
    } else if (newItemUrl) {
      // This will be handled by the Link wrapper
    }
  };

  const ButtonElement = onCreateNew ? (
    <Button
      className={cn(buttonVariants({ variant: "default" }))}
      onClick={handleClick}
    >
      <Plus className="mr-2 h-4 w-4" /> Add {itemName}
    </Button>
  ) : (
    <Link
      className={cn(buttonVariants({ variant: "default" }))}
      href={newItemUrl || "#"}
      onClick={onCreateNew ? handleClick : undefined}
    >
      <Plus className="mr-2 h-4 w-4" /> Add {itemName}
    </Link>
  );

  return (
    <div className="h-[calc(100vh-240px)] border border-dashed">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[1.5rem] font-bold leading-tight dark:text-black-2">
          No {itemName} data found
        </h1>
        <p className="text-sm text-center text-muted-foreground dark:text-black-2">
          There are no {itemName} records found at the moment, add new{" "}
          {itemName} record to start viewing data.
        </p>

        <div className="mt-6 flex gap-4">{ButtonElement}</div>
      </div>
    </div>
  );
}
