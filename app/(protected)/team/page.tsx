"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/team/columns";
import { AccountMember, listMembers, inviteMember } from "@/lib/actions/account-member-actions";
import { fetchRolesByScope } from "@/lib/actions/role-actions";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Role, RoleScope } from "@/types/roles/type";
import { Location } from "@/types/location/type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Basic RFC-5322-ish email check — good enough to catch typos client-side
// before the request round-trips; the backend remains the source of truth.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TeamPage() {
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [inviteData, setInviteData] = useState({ email: "", firstName: "", lastName: "", roleIds: [] as string[] });
  const [isInviting, setIsInviting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  // Target location for the (LOCATION-scoped) invite. Populated from the
  // accessible-locations list; pre-selected to the current location so the
  // invite never silently falls back to an ACCOUNT-wide grant.
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string>("");
  const { toast } = useToast();

  const loadMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listMembers();
      setMembers(data);
    } catch {
      // Failed to load
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  // Invites are LOCATION-scoped, so offer only the SELECTED location's roles,
  // refetched whenever the target location changes. This keeps the role choices
  // consistent with the invite target — the backend now rejects a role from a
  // different location, so a stale cross-location selection would 400.
  useEffect(() => {
    if (!locationId) {
      setRoles([]);
      return;
    }
    // Target location changed — drop any now-mismatched role selections.
    setInviteData((p) => ({ ...p, roleIds: [] }));
    fetchRolesByScope(RoleScope.LOCATION, locationId).then(setRoles).catch(() => setRoles([]));
  }, [locationId]);

  // Load accessible locations and default the invite target to the current
  // location (the one the dashboard is operating under). The picker lets the
  // inviter change it; if no location resolves the form blocks (see below).
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAllLocations(), getCurrentLocation()])
      .then(([list, current]) => {
        if (cancelled) return;
        setLocations(list);
        const preselect =
          (current?.id && list.some((l) => l.id === current.id) && current.id) ||
          (list.length === 1 ? list[0].id : "");
        setLocationId(preselect);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInvite = async () => {
    // Guard the same conditions the submit button disables on, so a stray
    // Enter / programmatic call can't bypass validation.
    if (!inviteData.firstName) return;
    if (!EMAIL_REGEX.test(inviteData.email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (inviteData.roleIds.length === 0) return;
    if (!locationId) return;
    setEmailError(null);
    setIsInviting(true);
    try {
      const result = await inviteMember({
        email: inviteData.email.trim(),
        firstName: inviteData.firstName,
        lastName: inviteData.lastName || undefined,
        roleIds: inviteData.roleIds,
        // Pass the scope explicitly so the invite never silently relies on
        // (or falls back past) the currentLocation cookie into ACCOUNT scope.
        scopes: [{ scopeType: "LOCATION", scopeId: locationId }],
      });
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.message,
      });
      if (result.responseType === "success") {
        setShowInvite(false);
        setInviteData({ email: "", firstName: "", lastName: "", roleIds: [] });
        loadMembers();
      }
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Account members" }]} />
      <PageHeader
        title="Account members"
        subtitle="Account members who can collaborate on this business."
        actions={
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Invite Member
          </Button>
        }
      />
      <PageBody>
        {isLoading ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading team members...</span>
            </CardContent>
          </Card>
        ) : members.length > 0 ? (
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <DataTable
                columns={columns}
                data={members}
                searchKey="firstName"
                pageNo={0}
                total={members.length}
                pageCount={1}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No team members yet</h3>
              <p className="text-xs text-muted-foreground mb-4">Invite members to collaborate on your account.</p>
              <Button size="sm" onClick={() => setShowInvite(true)}>
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Invite Member
              </Button>
            </CardContent>
          </Card>
        )}
      </PageBody>

      {/* Invite Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your account. They will receive an email to accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">First Name <span className="text-red-500">*</span></label>
                <Input
                  placeholder="First name"
                  value={inviteData.firstName}
                  onChange={(e) => setInviteData((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Last Name</label>
                <Input
                  placeholder="Last name"
                  value={inviteData.lastName}
                  onChange={(e) => setInviteData((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Email <span className="text-red-500">*</span></label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={inviteData.email}
                aria-invalid={!!emailError}
                onChange={(e) => {
                  setInviteData((p) => ({ ...p, email: e.target.value }));
                  if (emailError) setEmailError(null);
                }}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Roles</label>
              {inviteData.roleIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {inviteData.roleIds.map((id) => {
                    const role = roles.find((r) => r.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="text-xs gap-1 pr-1">
                        {role?.name || id}
                        <button type="button" onClick={() => setInviteData((p) => ({ ...p, roleIds: p.roleIds.filter((r) => r !== id) }))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <Select
                onValueChange={(val) => {
                  if (!inviteData.roleIds.includes(val)) {
                    setInviteData((p) => ({ ...p, roleIds: [...p.roleIds, val] }));
                  }
                }}
                value=""
              >
                <SelectTrigger><SelectValue placeholder="Add role" /></SelectTrigger>
                <SelectContent>
                  {roles.filter((r) => !inviteData.roleIds.includes(r.id)).map((role) => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {inviteData.roleIds.length === 0 && (
                <p className="text-xs text-muted-foreground">Select at least one role.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Location <span className="text-red-500">*</span></label>
              {locations.length > 0 ? (
                <>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {locationId ? (
                    <p className="text-xs text-muted-foreground">
                      Inviting to: <span className="font-medium">{locations.find((l) => l.id === locationId)?.name}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-red-500">Select a location to scope this invitation.</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-red-500">
                  No location is available to scope this invitation. Select a location first, then try again.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button
              disabled={
                isInviting ||
                !inviteData.firstName ||
                !EMAIL_REGEX.test(inviteData.email.trim()) ||
                inviteData.roleIds.length === 0 ||
                !locationId
              }
              onClick={handleInvite}
            >
              {isInviting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Sending...</> : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
