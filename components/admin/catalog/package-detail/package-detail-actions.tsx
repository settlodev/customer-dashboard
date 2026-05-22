"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Loader2, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { PackageFormDialog } from "@/components/admin/catalog/package-form-dialog";
import { deactivatePackage } from "@/lib/actions/admin/billing";
import { PackageResponse } from "@/types/admin/billing";

interface PackageDetailActionsProps {
  pkg: PackageResponse;
}

export function PackageDetailActions({ pkg }: PackageDetailActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);

  const handleDeactivate = () => {
    if (
      !confirm(
        `Deactivate "${pkg.name}"? New subscriptions can no longer pick this package; existing subscribers keep it.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deactivatePackage(pkg.id);
      if (result.responseType === "error") {
        toast({
          title: "Failed to deactivate",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.push("/packages");
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setFormOpen(true)}
        disabled={isPending}
      >
        <Edit2 className="mr-1.5 h-4 w-4" />
        Edit
      </Button>
      {pkg.isActive && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleDeactivate}
          disabled={isPending}
          className="text-destructive hover:bg-destructive/10"
        >
          {isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Power className="mr-1.5 h-4 w-4" />
          )}
          Deactivate
        </Button>
      )}

      <PackageFormDialog
        pkg={pkg}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
