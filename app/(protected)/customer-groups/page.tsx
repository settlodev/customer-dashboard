"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { UUID } from "node:crypto";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/loading";
import { toast } from "@/hooks/use-toast";

import { GroupDialog } from "@/components/forms/customer_group_form";
import {
  deleteCustomerGroup,
  fetchCustomerGroups,
} from "@/lib/actions/customer-actions";
import { CustomerGroup } from "@/types/customer/type";

export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [deletingId, setDeletingId] = useState<UUID | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCustomerGroups();
      setGroups(data);
    } catch (err) {
      console.error("Failed to load customer groups:", err);
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  const handleEdit = (group: CustomerGroup) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleDelete = async (id: UUID) => {
    setDeletingId(id);
    try {
      await deleteCustomerGroup(id);
      toast({
        variant: "success",
        title: "Success",
        description: "Group deleted successfully",
      });
      loadData();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete group",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Customer groups" }]} />
      <PageHeader
        title="Customer groups"
        subtitle="Organize and segment your customers into groups like VIPs, Corporate, or Regulars."
        actions={
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Group
          </Button>
        }
      />
      <PageBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loading />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-destructive/10">
                <AlertTriangle
                  className="h-5 w-5 text-destructive"
                  aria-hidden
                />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Couldn&apos;t load customer groups
              </h3>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={loadData}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <NoItems itemName="customer groups" onAdd={handleAdd} />
        ) : (
          <Card>
            <CardContent className="divide-y divide-line p-0">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink">
                        {group.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[11px] font-normal"
                      >
                        <Users className="h-3 w-3" aria-hidden />
                        {group.customerCount}{" "}
                        {group.customerCount === 1 ? "member" : "members"}
                      </Badge>
                      {!group.active && (
                        <Badge
                          variant="outline"
                          className="text-[11px] font-normal"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {group.description && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {group.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleEdit(group)}
                      aria-label={`Edit ${group.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDelete(group.id)}
                      disabled={deletingId === group.id}
                      className="text-destructive hover:text-destructive"
                      aria-label={`Delete ${group.name}`}
                    >
                      {deletingId === group.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </PageBody>

      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingGroup={editingGroup}
        onSaved={loadData}
      />
    </PageShell>
  );
}
