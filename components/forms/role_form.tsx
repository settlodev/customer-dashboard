"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

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
import { FormResponse } from "@/types/types";
import { RoleSchema } from "@/types/roles/schema";
import { FormError } from "@/components/widgets/form-error";
import { Role, RoleScope } from "@/types/roles/type";
import { Permission, PermissionListResponse } from "@/types/permissions/type";
import { Input } from "../ui/input";
import { fetchAllPermissions } from "@/lib/actions/permissions-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Info, Shield } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const RoleForm = ({ item }: { item: Role | null | undefined }) => {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, Permission[]>>({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (item) {
      setSelectedKeys(item.permissionKeys ?? []);
    }
  }, [item]);

  const form = useForm<z.infer<typeof RoleSchema>>({
    resolver: zodResolver(RoleSchema),
    defaultValues: item
      ? {
          name: item.name,
          description: item.description ?? "",
          scope: item.scope,
          scopeId: item.scopeId ?? undefined,
          permissionKeys: item.permissionKeys ?? [],
        }
      : { scope: RoleScope.LOCATION, permissionKeys: [] },
  });

  const initialized = useRef(false);

  useEffect(() => {
    async function loadPermissions() {
      if (!initialized.current) {
        initialized.current = true;
        setIsLoadingPermissions(true);
        try {
          const data: PermissionListResponse = await fetchAllPermissions();
          setPermissionsByCategory(data.byCategory ?? {});
        } catch {
          // Permissions unavailable
        }
        setIsLoadingPermissions(false);
      }
    }
    loadPermissions();
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
    values.permissionKeys = selectedKeys;

    startTransition(async () => {
      try {
        let result: FormResponse | void;
        if (item) {
          result = await updateRole(item.id, values);
        } else {
          result = await createRole(values);
        }
        if (result) {
          setResponse(result);
          if (result.responseType === "success") {
            toast({ variant: "success", title: "Success", description: result.message });
            router.push("/roles");
          }
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error?.message || "Failed" });
      }
    });
  };

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleCategory = (category: string) => {
    const categoryKeys = (permissionsByCategory[category] ?? []).map((p) => p.key);
    const allSelected = categoryKeys.every((k) => selectedKeys.includes(k));
    if (allSelected) {
      setSelectedKeys((prev) => prev.filter((k) => !categoryKeys.includes(k)));
    } else {
      setSelectedKeys((prev) => [...new Set([...prev, ...categoryKeys])]);
    }
  };

  const scopeOptions = [
    { value: RoleScope.ACCOUNT, label: "Account" },
    { value: RoleScope.BUSINESS, label: "Business" },
    { value: RoleScope.LOCATION, label: "Location" },
    { value: RoleScope.STORE, label: "Store" },
    { value: RoleScope.WAREHOUSE, label: "Warehouse" },
  ];

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="space-y-6">

        {/* Role Details & Scope */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <FormLabel>Role Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role name" {...field} disabled={isPending} />
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
                      <Textarea placeholder="Describe what this role can do" {...field} disabled={isPending} value={field.value || ""} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending || !!item}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scopeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Determines where this role can be used
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {item?.system && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <p className="text-xs text-amber-700 font-medium">System Role</p>
                  <p className="text-xs text-amber-600">This is a system-defined role and cannot be deleted.</p>
                </div>
              )}

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  {selectedKeys.length} permission{selectedKeys.length !== 1 ? "s" : ""} selected
                </p>
              </div>
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
            {isLoadingPermissions ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b">
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
                {Object.entries(permissionsByCategory)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, permissions]) => {
                    const categoryKeys = permissions.map((p) => p.key);
                    const allSelected = categoryKeys.every((k) => selectedKeys.includes(k));
                    const someSelected = categoryKeys.some((k) => selectedKeys.includes(k));

                    return (
                      <div key={category} className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                            {category}
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                              onChange={() => toggleCategory(category)}
                              className="h-3.5 w-3.5 rounded border-gray-300"
                            />
                            Select all
                          </label>
                        </div>
                        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {permissions
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((perm) => {
                              const selected = selectedKeys.includes(perm.key);
                              const action = perm.key.split(":")[1] || perm.name;
                              return (
                                <label
                                  key={perm.key}
                                  title={perm.description || perm.name}
                                  className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                                    selected
                                      ? "bg-primary/5 border border-primary/20"
                                      : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleKey(perm.key)}
                                    className="h-4 w-4 shrink-0 appearance-none rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 checked:bg-primary checked:border-primary bg-[length:12px_12px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%2F%3E%3C%2Fsvg%3E')]"
                                  />
                                  <span className={`text-xs font-medium ${selected ? "text-primary" : "text-gray-700 dark:text-gray-300"}`}>
                                    {action}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton label={item ? "Update role" : "Create role"} isPending={isPending} />
        </div>
      </form>
    </Form>
  );
};

export default RoleForm;
