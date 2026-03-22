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
import { Card, CardContent } from "../ui/card";
import { Checkbox } from "../ui/checkbox";

const RoleForm = ({ item }: { item: Role | null | undefined }) => {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [privileges, setPrivileges] = useState<string[]>([]);
  const [sections, setSections] = useState<PrivilegeItem[]>([]);
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
        const data = await fetchAllSections();
        setSections(data);
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
        {/* Role Details */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Role Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          rows={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status */}
            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-4">Settings</h3>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Role Status
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {field.value
                          ? "This role is currently active and can be assigned"
                          : "This role is currently inactive"}
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
            </div>
          </CardContent>
        </Card>

        {/* Privileges */}
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium">Permissions</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select the permissions this role should have
              </p>
            </div>

            <div className="space-y-4">
              {sections?.map((priv, index) => (
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
                    {priv.privilegeActions?.map(
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
                            onClick={() => selectAction(action.id)}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => selectAction(action.id)}
                              className="shrink-0"
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
