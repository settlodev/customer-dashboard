"use client";

import React, { useCallback, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";
import { UUID } from "node:crypto";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { CustomerGroup } from "@/types/customer/type";
import { CustomerGroupSchema } from "@/types/customer/schema";
import {
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
} from "@/lib/actions/customer-actions";

type GroupFormValues = z.infer<typeof CustomerGroupSchema>;

const GroupDialog = ({
  open,
  onOpenChange,
  editingGroup,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup: CustomerGroup | null;
  onSaved: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(CustomerGroupSchema),
    defaultValues: editingGroup
      ? { name: editingGroup.name }
      : { name: "" },
  });

  React.useEffect(() => {
    if (editingGroup) {
      form.reset({ name: editingGroup.name });
    } else {
      form.reset({ name: "" });
    }
  }, [editingGroup, form]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Please fill all the required fields",
    });
  }, []);

  const submitData = (values: GroupFormValues) => {
    startTransition(async () => {
      const action = editingGroup
        ? updateCustomerGroup(editingGroup.id, values)
        : createCustomerGroup(values);

      const data = await action;
      if (data) {
        if (data.responseType === "success") {
          toast({ variant: "success", title: "Success", description: data.message });
          onOpenChange(false);
          onSaved();
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.message,
          });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? "Edit Group" : "Create Customer Group"}
          </DialogTitle>
          <DialogDescription>
            {editingGroup
              ? "Update the group name"
              : "Create a new group to organize your customers"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitData, onInvalid)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., VIPs, Corporate, Regulars"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isPending
                  ? "Saving..."
                  : editingGroup
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const CustomerGroupManager = ({
  groups,
  onRefresh,
}: {
  groups: CustomerGroup[];
  onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
  const [deletingId, setDeletingId] = useState<UUID | null>(null);

  const handleEdit = (group: CustomerGroup) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: UUID) => {
    setDeletingId(id);
    try {
      await deleteCustomerGroup(id);
      toast({ variant: "success", title: "Success", description: "Group deleted successfully" });
      onRefresh();
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Customer Groups</CardTitle>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Group
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No customer groups yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create groups to organize and segment your customers
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleAdd}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add First Group
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {group.totalCustomers}{" "}
                        {group.totalCustomers === 1 ? "member" : "members"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(group)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {group.canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(group.id)}
                        disabled={deletingId === group.id}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        {deletingId === group.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingGroup={editingGroup}
        onSaved={onRefresh}
      />
    </>
  );
};

export default CustomerGroupManager;
