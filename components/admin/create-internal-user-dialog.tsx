"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { createInternalUser } from "@/lib/actions/admin/internal-users";
import { CreateInternalUserSchema } from "@/types/admin/schemas";
import { RolePermissionsResponse } from "@/types/admin/internal-user";
import { InternalRole } from "@/types/types";

interface CreateInternalUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RolePermissionsResponse[];
  onCreated: () => void;
}

function roleLabel(role: InternalRole): string {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) =>
    c.toUpperCase(),
  );
}

export function CreateInternalUserDialog({
  open,
  onOpenChange,
  roles,
  onCreated,
}: CreateInternalUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof CreateInternalUserSchema>>({
    resolver: zodResolver(CreateInternalUserSchema),
    defaultValues: {
      email: "",
      password: "",
      role: undefined as unknown as InternalRole,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setError("");
      setShowPassword(false);
    }
  }, [open, form]);

  const onSubmit = useCallback(
    (values: z.infer<typeof CreateInternalUserSchema>) => {
      setError("");
      startTransition(async () => {
        const result = await createInternalUser(values);
        if (result.responseType === "error") {
          setError(result.message);
          return;
        }
        toast({
          title: "Internal user created",
          description: `${values.email} can now sign in to the staff portal.`,
        });
        onCreated();
        onOpenChange(false);
      });
    },
    [onCreated, onOpenChange, toast],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create internal user</DialogTitle>
          <DialogDescription>
            New staff members can sign in immediately. Choose a role to scope
            their access.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="firstname.lastname@settlo.co.tz"
                      autoComplete="off"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 12 characters"
                        autoComplete="new-password"
                        disabled={isPending}
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={isPending}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-ink"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Creating…
                  </span>
                ) : (
                  "Create user"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
