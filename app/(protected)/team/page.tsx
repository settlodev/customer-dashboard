"use client";

import React, { useCallback, useEffect, useState } from "react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/team/columns";
import { AccountMember, listMembers, inviteMember } from "@/lib/actions/account-member-actions";
import { fetchAllRoles } from "@/lib/actions/role-actions";
import { Role } from "@/types/roles/type";
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

const breadcrumbItems = [{ title: "Team", link: "/team" }];

export default function TeamPage() {
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [inviteData, setInviteData] = useState({ email: "", firstName: "", lastName: "", roleIds: [] as string[] });
  const [isInviting, setIsInviting] = useState(false);
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

  useEffect(() => {
    fetchAllRoles().then(setRoles).catch(() => {});
  }, []);

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.firstName) return;
    setIsInviting(true);
    try {
      const result = await inviteMember({
        email: inviteData.email,
        firstName: inviteData.firstName,
        lastName: inviteData.lastName || undefined,
        roleIds: inviteData.roleIds,
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex items-center justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button size="sm" onClick={() => setShowInvite(true)}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Invite Member
        </Button>
      </div>

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
                onChange={(e) => setInviteData((p) => ({ ...p, email: e.target.value }))}
              />
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
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button
              disabled={isInviting || !inviteData.email || !inviteData.firstName}
              onClick={handleInvite}
            >
              {isInviting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Sending...</> : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
