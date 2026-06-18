"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { resyncAllCatalogs } from "@/lib/actions/admin/inventory-operations";

/**
 * Super-admin only (the page renders this only for SYSTEM_ADMIN / SUPER_ADMIN,
 * and the backend re-checks `ROLE_SYSTEM_ADMIN`). Re-publishes every location's
 * catalogue so the Reports Service backfills the category/department taxonomy.
 */
export function SyncAllCatalogsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleResyncAll = () => {
    const ok = window.confirm(
      "Resync EVERY location's product catalogue platform-wide? This re-publishes all products so reporting backfills its category/department data. It's idempotent (safe to re-run) but can be heavy.",
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await resyncAllCatalogs();
      toast({
        variant: res.responseType === "success" ? "success" : "destructive",
        title:
          res.responseType === "success"
            ? "Platform resync started"
            : "Resync failed",
        description: res.message,
      });
      if (res.responseType === "success") router.refresh();
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleResyncAll}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-1.5 h-4 w-4" />
      )}
      Sync all catalogs
    </Button>
  );
}
