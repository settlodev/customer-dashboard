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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { updateInternalUserRole } from "@/lib/actions/admin/internal-users";
import { UpdateInternalRoleSchema } from "@/types/admin/schemas";
import {
  InternalUserResponse,
  RolePermissionsResponse,
} from "@/types/admin/internal-user";
import { InternalRole } from "@/types/types";

interface EditInternalUserDialogProps {
  user: InternalUserResponse;
  roles: RolePermissionsResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

function roleLabel(role: InternalRole): string {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) =>
    c.toUpperCase(),
  );
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

  const form = useForm<z.infer<typeof UpdateInternalRoleSchema>>({
    resolver: zodResolver(UpdateInternalRoleSchema),
    defaultValues: { role: user.internalRole },
  });

  useEffect(() => {
    if (open) {
      form.reset({ role: user.internalRole });
      setError("");
    }
  }, [open, user.internalRole, form]);

  const onSubmit = useCallback(
    (values: z.infer<typeof UpdateInternalRoleSchema>) => {
      if (values.role === user.internalRole) {
        onOpenChange(false);
        return;
      }
      setError("");
      startTransition(async () => {
        const result = await updateInternalUserRole(user.id, values);
        if (result.responseType === "error") {
          setError(result.message);
          return;
        }
        toast({
          title: "Role updated",
          description: `${user.email} is now a ${roleLabel(values.role)}.`,
        });
        onUpdated();
        onOpenChange(false);
      });
    },
    [onOpenChange, onUpdated, toast, user.email, user.id, user.internalRole],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription className="break-all">
            Update the access level for <strong>{user.email}</strong>.
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.role} value={r.role}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {roleLabel(r.role)}
                            </span>
                            {r.description && (
                              <span className="text-xs text-muted-foreground">
                                {r.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
