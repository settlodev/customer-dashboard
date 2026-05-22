"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Edit2,
  Layers,
  Loader2,
  MoreHorizontal,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import { AttachFeatureDialog } from "@/components/admin/catalog/attach-feature-dialog";
import { FeatureFormDialog } from "@/components/admin/catalog/feature-form-dialog";
import {
  listPackageFeatures,
  removePackageFeature,
  toggleFeature,
} from "@/lib/actions/admin/billing";
import {
  FeatureResponse,
  FeatureType,
  PackageFeatureMappingResponse,
  PackageResponse,
} from "@/types/admin/billing";

interface FeaturesViewProps {
  features: FeatureResponse[];
  packages: PackageResponse[];
}

const FEATURE_TYPE_TONE: Record<FeatureType, string> = {
  CORE:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  ADVANCED:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  PREMIUM:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  LIMIT:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
};

export function FeaturesView({ features, packages }: FeaturesViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Catalog dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FeatureResponse | null>(null);

  // Per-package mapping state — kept here (not in URL) because the
  // picker is exploratory; persisting it would push the user back to a
  // stale package after a refresh.
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(
    packages.find((p) => p.isActive)?.id ?? null,
  );
  const selectedPkg = packages.find((p) => p.id === selectedPkgId) ?? null;
  const [mappings, setMappings] = useState<PackageFeatureMappingResponse[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [mappingsError, setMappingsError] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);

  const refreshMappings = (pkgId: string) => {
    setMappingsLoading(true);
    setMappingsError(null);
    listPackageFeatures(pkgId)
      .then((m) => setMappings(m))
      .catch((err: any) =>
        setMappingsError(err?.message ?? "Failed to load mapping."),
      )
      .finally(() => setMappingsLoading(false));
  };

  useEffect(() => {
    if (!selectedPkgId) {
      setMappings([]);
      return;
    }
    refreshMappings(selectedPkgId);
  }, [selectedPkgId]);

  const handleNewFeature = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const handleEditFeature = (f: FeatureResponse) => {
    setEditing(f);
    setFormOpen(true);
  };

  const handleToggle = (f: FeatureResponse) => {
    setBusyId(f.id);
    startTransition(async () => {
      const result = await toggleFeature(f.id);
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to toggle",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  const handleRemoveMapping = (m: PackageFeatureMappingResponse) => {
    if (!selectedPkgId) return;
    if (
      !confirm(
        `Remove "${m.feature.name}" from ${selectedPkg?.name}? Existing entitlement caches will be flushed.`,
      )
    ) {
      return;
    }
    setBusyId(m.feature.id);
    startTransition(async () => {
      const result = await removePackageFeature(
        selectedPkgId,
        m.feature.featureKey,
      );
      setBusyId(null);
      if (result.responseType === "error") {
        toast({
          title: "Failed to remove",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      refreshMappings(selectedPkgId);
    });
  };

  return (
    <div className="space-y-8">
      {/* Feature catalog */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Feature catalog</h2>
            <p className="font-mono text-[12px] text-muted-foreground">
              {features.filter((f) => f.isActive !== false).length} active ·{" "}
              {features.filter((f) => f.isActive === false).length} disabled
            </p>
          </div>
          <Button size="sm" onClick={handleNewFeature}>
            <Plus className="mr-1.5 h-4 w-4" />
            New feature
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No features yet. Define one to start gating package
                    entitlements.
                  </TableCell>
                </TableRow>
              ) : (
                features.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                          <Layers className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {f.name}
                          </p>
                          {f.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {f.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {f.featureKey}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${FEATURE_TYPE_TONE[f.featureType]}`}
                      >
                        {f.featureType}
                      </span>
                    </TableCell>
                    <TableCell>
                      {f.isActive === false ? (
                        <Badge
                          variant="outline"
                          className="border-muted bg-muted text-muted-foreground"
                        >
                          Disabled
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                        >
                          Active
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
                            aria-label={`Actions for ${f.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEditFeature(f)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => handleToggle(f)}
                            disabled={isPending && busyId === f.id}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {f.isActive === false ? "Enable" : "Disable"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Package-feature mapping */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-ink">Package mapping</h2>
            <p className="font-mono text-[12px] text-muted-foreground">
              Pick a package to see which features it ships with.
            </p>
          </div>
          <div className="ml-auto flex items-end gap-2">
            <Select
              value={selectedPkgId ?? ""}
              onValueChange={(v) => setSelectedPkgId(v || null)}
            >
              <SelectTrigger className="h-9 w-[260px] text-[12.5px]">
                <SelectValue placeholder="Pick a package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.entityType.toLowerCase()}
                    {p.isActive ? "" : " (off)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => setAttachOpen(true)}
              disabled={!selectedPkg}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Attach feature
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-card">
          {!selectedPkg ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Pick a package to start.
            </p>
          ) : mappingsError ? (
            <p className="px-4 py-6 text-center text-sm text-destructive">
              {mappingsError}
            </p>
          ) : mappingsLoading ? (
            <p className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading mapping…
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Included</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No features attached to this package yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  mappings.map((m) => (
                    <TableRow key={m.feature.id}>
                      <TableCell>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {m.feature.name}
                        </p>
                        {m.feature.description && (
                          <p className="text-xs text-muted-foreground">
                            {m.feature.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {m.feature.featureKey}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {m.featureValue ?? "—"}
                      </TableCell>
                      <TableCell>
                        {m.isIncluded === false ? (
                          <Badge
                            variant="outline"
                            className="border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                          >
                            Excluded
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                          >
                            Included
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMapping(m)}
                          disabled={isPending && busyId === m.feature.id}
                          aria-label={`Remove ${m.feature.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <FeatureFormDialog
        feature={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => router.refresh()}
      />

      {selectedPkg && (
        <AttachFeatureDialog
          pkg={selectedPkg}
          features={features}
          alreadyAttached={mappings}
          open={attachOpen}
          onOpenChange={setAttachOpen}
          onAttached={() => refreshMappings(selectedPkg.id)}
        />
      )}
    </div>
  );
}
