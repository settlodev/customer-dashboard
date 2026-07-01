"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addStaffAssignment,
  getStaffAssignments,
  removeStaffAssignment,
  type StaffAssignmentDto,
} from "@/lib/actions/staff-actions";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { fetchRolesByScope } from "@/lib/actions/role-actions";
import { RoleScope, type Role } from "@/types/roles/type";
import type { Location } from "@/types/location/type";

/**
 * "Additional locations" manager on the staff detail page. Lets a merchant
 * assign a staff member to other locations (with a role each) so they can work
 * at and switch between them. The staff member's PRIMARY location is managed via
 * their roles, not here — this only covers the secondary assignments.
 */
export function StaffAssignmentsSection({
  staffId,
  primaryLocationId,
}: {
  staffId: string;
  primaryLocationId?: string | null;
}) {
  const [assignments, setAssignments] = useState<StaffAssignmentDto[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locationId, setLocationId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [a, locs] = await Promise.all([
      getStaffAssignments(staffId),
      fetchAllLocations(),
    ]);
    setAssignments(a.filter((x) => x.active));
    setLocations(locs ?? []);
    setLoading(false);
  }, [staffId]);

  useEffect(() => {
    load();
  }, [load]);

  // Load the picked location's roles for the role selector.
  useEffect(() => {
    if (!locationId) {
      setRoles([]);
      return;
    }
    let active = true;
    fetchRolesByScope(RoleScope.LOCATION, locationId).then((r) => {
      if (active) setRoles(r ?? []);
    });
    return () => {
      active = false;
    };
  }, [locationId]);

  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? id;

  const assignedLocationIds = new Set(
    assignments.filter((a) => a.scopeType === "LOCATION").map((a) => a.scopeId),
  );
  const availableLocations = locations.filter(
    (l) => l.id !== primaryLocationId && !assignedLocationIds.has(l.id),
  );

  // Only secondary (non-primary) LOCATION assignments are managed here.
  const secondary = assignments.filter(
    (a) => !a.primary && a.scopeType === "LOCATION",
  );

  const onAdd = async () => {
    if (!locationId || !roleId) return;
    setBusy("add");
    const res = await addStaffAssignment(staffId, {
      scopeType: "LOCATION",
      scopeId: locationId,
      roleId,
    });
    toast({
      variant: res.responseType === "error" ? "destructive" : "success",
      title: res.responseType === "error" ? "Couldn't add location" : "Location added",
      description: res.message,
    });
    if (res.responseType !== "error") {
      setLocationId("");
      setRoleId("");
      await load();
    }
    setBusy(null);
  };

  const onRemove = async (id: string) => {
    setBusy(id);
    const res = await removeStaffAssignment(staffId, id);
    toast({
      variant: res.responseType === "error" ? "destructive" : "success",
      title: res.responseType === "error" ? "Couldn't remove" : "Location removed",
      description: res.message,
    });
    if (res.responseType !== "error") await load();
    setBusy(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Additional locations</h3>
        <p className="text-xs text-muted-foreground">
          Assign this person to other locations (with a role each) so they can
          work at and switch between them.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {secondary.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No additional locations yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {secondary.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border p-2.5"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{locationName(a.scopeId)}</span>
                    {a.roleName ? (
                      <span className="text-muted-foreground">· {a.roleName}</span>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => onRemove(a.id)}
                    aria-label="Remove location"
                  >
                    {busy === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
                Location
              </label>
              <Select
                value={locationId}
                onValueChange={(v) => {
                  setLocationId(v);
                  setRoleId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
                Role
              </label>
              <Select value={roleId} onValueChange={setRoleId} disabled={!locationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={onAdd}
              disabled={!locationId || !roleId || busy !== null}
            >
              {busy === "add" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
