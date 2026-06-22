"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreVertical, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { resyncLocationCatalog } from "@/lib/actions/admin/inventory-operations";

/**
 * Per-location admin row actions. "Resync catalog" re-publishes the location's
 * products so the Reports Service backfills the category/department taxonomy AND
 * product images (top-selling-items thumbnails) — one resync covers both.
 */
export function LocationRowActions({ locationId }: { locationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleResync = () =>
    startTransition(async () => {
      const res = await resyncLocationCatalog(locationId);
      toast({
        variant: res.responseType === "success" ? "success" : "destructive",
        title:
          res.responseType === "success"
            ? "Catalog resync started"
            : "Resync failed",
        description: res.message,
      });
      if (res.responseType === "success") router.refresh();
    });

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          disabled={isPending}
          aria-label="Location actions"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleResync} disabled={isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Resync catalog
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
