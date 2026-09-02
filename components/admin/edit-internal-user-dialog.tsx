"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { updateInternalUserRoles } from "@/lib/actions/admin/internal-users";
import { UpdateInternalRolesSchema } from "@/types/admin/schemas";
import {
  InternalUserResponse,
  RolePermissionsResponse,
} from "@/types/admin/internal-user";

interface EditInternalUserDialogProps {
  user: InternalUserResponse;
  roles: RolePermissionsResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) =>
    c.toUpperCase(),
  );
}

function sameRoles(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sorted = [...b].sort();
  return [...a].sort().every((v, i) => v === sorted[i]);
}

export function EditInternalUserDialog({
  user,
  roles,
  open,
  onOpenChange,
  onUpdated,
}: EditInternalUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const currentRoleCodes = user.roles.map((r) => r.code);

  const form = useForm<z.infer<typeof UpdateInternalRolesSchema>>({
    resolver: zodResolver(UpdateInternalRolesSchema),
    defaultValues: { roles: currentRoleCodes },
  });

  useEffect(() => {
    if (open) {
      form.reset({ roles: currentRoleCodes });
      setError("");
    }
    // currentRoleCodes is derived fresh from user.roles every render; only
    // re-seed the form when the dialog opens or the user identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user.id, form]);

  const onSubmit = useCallback(
    (values: z.infer<typeof UpdateInternalRolesSchema>) => {
      if (sameRoles(values.roles, currentRoleCodes)) {
        onOpenChange(false);
        return;
      }
      setError("");
      startTransition(async () => {
        const result = await updateInternalUserRoles(user.id, values);
        if (result.responseType === "error") {
          setError(result.message);
          return;
        }
        const newRoleNames = values.roles
          .map((code) => roles.find((r) => r.role === code)?.name ?? roleLabel(code))
          .join(", ");
        toast({
          title: "Roles updated",
          description: `${user.email} now has: ${newRoleNames}.`,
        });
        onUpdated();
        onOpenChange(false);
      });
    },
    [onOpenChange, onUpdated, toast, user.email, user.id, currentRoleCodes, roles],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Manage roles</DialogTitle>
          <DialogDescription className="break-all">
            Update the access level for <strong>{user.email}</strong>. This
            replaces their full set of roles.
          </DialogDescription>
        </DialogHeader>

        {error && <FormError message={error} />}

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            noValidate
          >
            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => {
                const selected = field.value ?? [];
                return (
                  <FormItem>
                    <FormLabel>Roles</FormLabel>
                    <FormControl>
                      <MultiSelect
                        key={selected.join(",")}
                        options={roles.map((r) => ({
                          label: r.name,
                          value: r.role,
                        }))}
                        onValueChange={field.onChange}
                        defaultValue={selected}
                        placeholder="Choose one or more roles"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
