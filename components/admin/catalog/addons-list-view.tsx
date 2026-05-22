"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit2, MoreHorizontal, PackagePlus, Plus, Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import { AddonFormDialog } from "@/components/admin/catalog/addon-form-dialog";
import { deactivateAddon } from "@/lib/actions/admin/billing";
import { AddonResponse } from "@/types/admin/billing";

interface AddonsListViewProps {
  addons: AddonResponse[];
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function AddonsListView({ addons }: AddonsListViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AddonResponse | null>(null);

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (addon: AddonResponse) => {
    setEditing(addon);
    setFormOpen(true);
  };

  const handleDeactivate = (addon: AddonResponse) => {
    if (
      !confirm(
        `Deactivate "${addon.name}"? Existing subscriptions keep the addon; new attachments will be blocked.`,
      )
    ) {
      return;
    }
    setBusyId(addon.id);
    startTransition(async () => {
      const result = await deactivateAddon(addon.id);
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to deactivate addon",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  const active = addons.filter((a) => a.isActive);
  const archived = addons.filter((a) => !a.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[12px] text-muted-foreground">
          {active.length} active · {archived.length} deactivated
        </p>
        <Button size="sm" onClick={handleNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          New addon
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Addon</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No addons yet. Create one to offer optional paid features.
                </TableCell>
              </TableRow>
            ) : (
              addons.map((addon) => (
                <TableRow key={addon.id}>
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                        <PackagePlus className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {addon.name}
                        </p>
                        {addon.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {addon.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {addon.entityType}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatMoney(addon.price)}
                  </TableCell>
                  <TableCell>
                    {addon.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-muted bg-muted text-muted-foreground"
                      >
                        Deactivated
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Actions for ${addon.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEdit(addon)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {addon.isActive && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => handleDeactivate(addon)}
                              disabled={isPending && busyId === addon.id}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Power className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddonFormDialog
        addon={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
