"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AccountMember,
  updateMemberRoles,
  updateMemberScopes,
} from "@/lib/actions/account-member-actions";
import { Location } from "@/types/location/type";
import { RoleScope } from "@/types/roles/type";
import RoleSelector from "@/components/widgets/role-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  member: AccountMember;
  /** Accessible locations the member can be assigned to. */
  locations: Location[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful update so the parent can reload the list. */
  onUpdated: () => void;
}

/**
 * Edit an existing account member's roles and assigned location.
 *
 * Invited members are LOCATION-scoped, and roles are location-specific — so the
 * role picker is scoped to the selected location, mirroring the invite flow.
 * Reassigning the location clears the (now-mismatched) role selection.
 */
export const EditMemberDialog: React.FC<Props> = ({
  member,
  locations,
  open,
  onOpenChange,
  onUpdated,
}) => {
  // The member's current LOCATION assignment and roles — the form's baseline.
  const currentLocationId =
    member.scopes?.find((s) => s.scopeType === "LOCATION")?.scopeId ?? "";
  const currentRoleIds = (member.roles ?? []).map((r) => r.id);

  const [locationId, setLocationId] = useState(currentLocationId);
  const [roleIds, setRoleIds] = useState<string[]>(currentRoleIds);
  const [isSaving, setIsSaving] = useState(false);

  // Reset the form to the member's current values whenever the dialog opens, so
  // a cancelled edit never bleeds into the next open (the instance is reused).
  useEffect(() => {
    if (open) {
      setLocationId(currentLocationId);
      setRoleIds(currentRoleIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reassigning to a different location invalidates the current role choices —
  // the backend rejects a role from another location — so clear them; returning
  // to the original location restores the member's existing roles.
  const handleLocationChange = (id: string) => {
    setLocationId(id);
    setRoleIds(id === currentLocationId ? currentRoleIds : []);
  };

  const locationChanged = locationId !== currentLocationId;

  const rolesChanged =
    roleIds.length !== currentRoleIds.length ||
    !roleIds.every((id) => currentRoleIds.includes(id));

  const handleSave = async () => {
    if (!locationId || roleIds.length === 0) return;
    setIsSaving(true);
    try {
      // Update the scope first when reassigning, so the new roles validate
      // against the member's new location. Preserve any non-LOCATION scopes.
      if (locationChanged) {
        const otherScopes = (member.scopes ?? []).filter(
          (s) => s.scopeType !== "LOCATION",
        );
        const scopeRes = await updateMemberScopes(member.id, [
          ...otherScopes,
          { scopeType: "LOCATION", scopeId: locationId },
        ]);
        if (scopeRes.responseType !== "success") {
          toast({ variant: "destructive", title: scopeRes.message });
          return;
        }
      }

      const res = await updateMemberRoles(member.id, roleIds);
      toast({
        variant: res.responseType === "success" ? "success" : "destructive",
        title: res.message,
      });
      if (res.responseType === "success") {
        onUpdated();
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit team member</DialogTitle>
          <DialogDescription>
            Update the assigned location and roles for this member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Member identity (read-only) */}
          <div className="rounded-md border border-line bg-surface px-3 py-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Location <span className="text-red-500">*</span>
            </label>
            {locations.length > 0 ? (
              <Select value={locationId} onValueChange={handleLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-red-500">
                No location is available to scope this member.
              </p>
            )}
            {locationChanged && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Reassigning location — choose the roles for the new location below.
              </p>
            )}
          </div>

          {/* Roles */}
          <div className="space-y-1">
            <label className="text-xs font-medium">
              Roles <span className="text-red-500">*</span>
            </label>
            {locationId ? (
              <RoleSelector
                multiple
                scope={RoleScope.LOCATION}
                scopeId={locationId}
                value={roleIds}
                onChange={(v) => setRoleIds(Array.isArray(v) ? v : [v])}
                placeholder="Add role"
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                Select a location to choose roles.
              </p>
            )}
            {locationId && roleIds.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select at least one role.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              isSaving ||
              !locationId ||
              roleIds.length === 0 ||
              (!locationChanged && !rolesChanged)
            }
            onClick={handleSave}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
