import Link from "next/link";
import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLocationListItem } from "@/types/admin/business";

interface BusinessLocationsPanelProps {
  locations: AdminLocationListItem[];
  error: string | null;
  activeCount: number;
  totalCount: number;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

export function BusinessLocationsPanel({
  locations,
  error,
  activeCount,
  totalCount,
}: BusinessLocationsPanelProps) {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <MapPin className="h-4 w-4 text-primary" />
          Locations
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          {activeCount} active
          {totalCount !== activeCount ? ` · ${totalCount} total` : ""}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : locations.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-4 text-center text-sm text-muted-foreground">
          No locations registered for this business yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/locations/${loc.id}`}
                        className="font-medium text-ink hover:text-primary"
                      >
                        {loc.name}
                      </Link>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {loc.identifier}
                        {loc.phoneNumber ? ` · ${loc.phoneNumber}` : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {loc.businessTypeName ?? "—"}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {loc.region
                      ? `${loc.region}${loc.district ? `, ${loc.district}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        loc.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                      }
                    >
                      {loc.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {loc.timezone ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {formatDate(loc.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
