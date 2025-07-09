"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback,useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Switch } from "@nextui-org/switch";
import { cn } from "@nextui-org/react";


import {
    Form,
    FormControl,
    FormField,
    FormItem, FormLabel,
    FormMessage,
} from "@/components/ui/form";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import { FormResponse} from "@/types/types";
import { RoleSchema } from "@/types/roles/schema";
import { FormError } from "@/components/widgets/form-error";
import { Role } from "@/types/roles/type";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createWarehouseRole, updateWarehouseRole } from "@/lib/actions/warehouse/roles-action";


const WarehouseRoleForm = ({ item }: { item: Role | null | undefined }) => {
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    const [isActive, setIsActive] = useState(item ? item.status : true);
   
 
    // const [role] = useState<Role | null>(item ? item : null);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof RoleSchema>>({
        resolver: zodResolver(RoleSchema),
        defaultValues: item ? item : { status: true },
    });

    const submitData = (values: z.infer<typeof RoleSchema>) => {
        setResponse(undefined);

        startTransition(() => {
            if (item) {
                updateWarehouseRole(item.id, values).then((data) => {
                    if (data) setResponse(data);
                    if (data && data.responseType === "success") {
                        toast({
                            title: "Success",
                            description: data.message,
                        });
                        router.push("/roles");
                    }
                });
            } else {
                createWarehouseRole(values).then((data) => {
                    if (data) setResponse(data);
                    if (data && data.responseType === "success") {
                        toast({
                            title: "Success",
                            description: data.message,
                        });
                        router.push("/roles");
                    }
                });
            }
        });
    }

   

    const onInvalid = useCallback(
        (errors: any) => {

            toast({
                variant: "destructive",
                title: "Uh oh! something went wrong",
                description: errors.message
                    ? errors.message
                    : "There was an issue submitting your form, please try later",
            });
        },
        [toast]
    );

    return (
        <Form {...form}>
            <FormError message={response?.message} />
            <form className="space-y-8" onSubmit={form.handleSubmit(submitData, onInvalid)}>
                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-3 gap-4">

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role Name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Enter role name"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Switch
                                        {...field}
                                        checked={field.value}
                                        classNames={{
                                            base: cn(
                                                "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center",
                                                "justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-destructive",
                                                "data-[selected=true]:border-success",
                                            ),
                                            wrapper: "p-0 h-3 overflow-visible",
                                            thumb: cn(
                                                "w-6 h-6 border-2 shadow-lg",
                                                "group-data-[hover=true]:border-primary",
                                                "group-data-[selected=true]:ml-6",
                                                "group-data-[pressed=true]:w-7",
                                                "group-data-[selected]:group-data-[pressed]:ml-4",
                                            ),
                                        }}
                                        color="success"
                                        isDisabled={isPending}
                                        isSelected={isActive}
                                        value={String(field.value)}
                                        onValueChange={setIsActive}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm">Role status</p>
                                            <p className="text-tiny text-default-400">
                                                Role will be enabled
                                            </p>
                                        </div>
                                    </Switch>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Role Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    disabled={isPending}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="Describe the role"
                                />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

               

                <div className="flex h-5 items-center space-x-4">
                    <CancelButton />
                    <Separator orientation="vertical" />
                    <SubmitButton label={item ? "Update role details" : "Create role"} isPending={isPending} />
                </div>
            </form>
        </Form>
    );
};

export default WarehouseRoleForm;
