"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import { Switch } from "@/components/ui/switch";
import { Separator } from "../ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createRole, updateRole } from "@/lib/actions/role-actions";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import {
  FormResponse,
  PrivilegeActionItem,
  PrivilegeItem,
} from "@/types/types";
import { RoleSchema } from "@/types/roles/schema";
import { FormError } from "@/components/widgets/form-error";
import { Role } from "@/types/roles/type";
import { Input } from "../ui/input";
import { fetchAllSections } from "@/lib/actions/privileges-actions";
import _ from "lodash";
import { UUID } from "node:crypto";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Info, Shield } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

const RoleForm = ({ item }: { item: Role | null | undefined }) => {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [privileges, setPrivileges] = useState<string[]>([]);
  const [sections, setSections] = useState<PrivilegeItem[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (item) {
      const myPrivs: string[] = item.privilegeActions.map(
        (priv) => priv.id,
      );
      setPrivileges(myPrivs);
    }
  }, [item]);

  const form = useForm<z.infer<typeof RoleSchema>>({
    resolver: zodResolver(RoleSchema),
    defaultValues: item ? item : { status: true },
  });

  const initialized = useRef(false);

  useEffect(() => {
    async function getData() {
      if (!initialized.current) {
        initialized.current = true;
        setIsLoadingSections(true);
        const data = await fetchAllSections();
        setSections(data);
        setIsLoadingSections(false);
      }
    }
    getData();
  }, []);

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "Please check your inputs and try again.",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof RoleSchema>) => {
    setResponse(undefined);

    if (privileges.length > 0) {
      values.privilegeActionsIds = _.compact(privileges);

      startTransition(() => {
        if (item) {
          updateRole(item.id, values).then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({ variant: "success", title: "Success", description: data.message });
              router.push("/roles");
            }
          });
        } else {
          createRole(values).then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({ variant: "success", title: "Success", description: data.message });
              router.push("/roles");
            }
          });
        }
      });
    }
  };

  const selectAction = (action_id: UUID) => {
    setPrivileges((prev) => {
      if (prev.includes(action_id)) {
        return prev.filter((id) => id !== action_id);
      }
      return [...prev, action_id];
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        {/* Role Details & Status — side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Details */}
          <Card className="rounded-xl shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Role Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Role Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter role name"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this role can do"
                        {...field}
                        disabled={isPending}
                        value={field.value || ""}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Active
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {field.value
                          ? "This role can be assigned to staff"
                          : "This role is currently disabled"}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Permissions */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Permissions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select the permissions this role should have
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingSections ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <Skeleton key={j} className="h-9 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="space-y-4">
              {sections
                ?.slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((priv, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {priv.name}
                    </h4>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {priv.privilegeActions
                      ?.slice()
                      .sort((a, b) => (a.action || "").localeCompare(b.action || ""))
                      .map(
                      (action: PrivilegeActionItem, i) => {
                        if (!action.action) return null;
                        const selected = privileges.includes(action.id);
                        return (
                          <label
                            key={i}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                              selected
                                ? "bg-primary/5 border border-primary/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => selectAction(action.id)}
                              className="h-4 w-4 shrink-0 appearance-none rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 checked:bg-primary checked:border-primary bg-[length:12px_12px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')]"
                            />
                            <span
                              className={`text-xs font-medium ${
                                selected
                                  ? "text-primary"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {action.action}
                            </span>
                          </label>
                        );
                      },
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            label={item ? "Update role" : "Create role"}
            isPending={isPending}
          />
        </div>
      </form>
    </Form>
  );
};

export default RoleForm;
