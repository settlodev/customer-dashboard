"use client";

import Link from "next/link";
import { CreditCard, Eye, MoreHorizontal, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminBusinessListItem } from "@/types/admin/business";

/**
 * Row actions for the businesses table. Businesses are read-only in the
 * admin (no suspend/delete endpoints), so this is a navigation menu into the
 * business detail, its billing, and the owning account.
 */
export function BusinessRowActions({
  business,
}: {
  business: AdminBusinessListItem;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Actions for ${business.name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/businesses/${business.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/businesses/${business.id}/billing`}>
            <CreditCard className="mr-2 h-4 w-4" />
            View billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/accounts/${business.accountId}`}>
            <User className="mr-2 h-4 w-4" />
            View owner account
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
