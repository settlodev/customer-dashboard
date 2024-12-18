"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Switch } from "@nextui-org/switch";
import { cn } from "@nextui-org/react";

import { Separator } from "../ui/separator";

import {
    Form,
    FormControl,
    FormField,
    FormItem, FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { createRole, updateRole } from "@/lib/actions/role-actions";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import { FormResponse, PrivilegeActionItem, PrivilegeItem } from "@/types/types";
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

const RoleForm = ({ item }: { item: Role | null | undefined }) => {
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    const [isActive, setIsActive] = useState(item ? item.status : true);
    const [privileges, setPrivileges] = useState<string[]>([]);
    const [sections, setSections] = useState<PrivilegeItem[]>([]);
    // const [role] = useState<Role | null>(item ? item : null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (item) {
            const myPrivs: string[] = [];
            item.privilegeActions.map(priv => {
                myPrivs.push(priv.id);
            });
            setPrivileges(myPrivs);
        }
    }, [item]);

    const form = useForm<z.infer<typeof RoleSchema>>({
        resolver: zodResolver(RoleSchema),
        defaultValues: item ? item : { status: true },
    });

    const submitData = (values: z.infer<typeof RoleSchema>) => {
        setResponse(undefined);

        if (privileges.length > 0) {
            values.privilegeActionsIds = _.compact(privileges);
            console.log("values:", values);

            startTransition(() => {
                if (item) {
                    updateRole(item.id, values).then((data) => {
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
                    createRole(values).then((data) => {
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
    }

    const initialized = useRef(false);

    useEffect(() => {

        async function getData() {
            if (!initialized.current) {
                initialized.current = true
                const data = await fetchAllSections();
                setSections(data);
            }
        }
        getData();

    }, []);

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

    const selectAction = (action_id: UUID) => {
        setPrivileges(prevPrivileges => {
            if (prevPrivileges.includes(action_id)) {
                return prevPrivileges.filter(id => id !== action_id);
            } 
            return [...prevPrivileges, action_id];
        });
    }

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

                <div className='popup-content'>
    <h4 className="text-lg font-semibold mb-4">Select Privileges</h4>
    <div className="grid gap-2 ">
        {sections?.map((priv, index) => (
            <div 
                key={index} 
                className="bg-white border rounded-lg shadow-lg p-4"
            >
                <h5 className="text-md font-bold text-gray-700 mb-3 border-b pb-2">
                    {priv.name}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                    {priv.privilegeActions && priv.privilegeActions.map((action: PrivilegeActionItem, i) => {
                        const selected: boolean = privileges.includes(action.id);
                        return action.action ? (
                            <div 
                                key={i}
                                className={`
                                    flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-200
                                    ${selected 
                                        ? 'bg-emerald-50 border-emerald-200 border' 
                                        : 'hover:bg-gray-50 border border-transparent'}
                                `}
                                onClick={() => selectAction(action.id)}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={selected} 
                                    onChange={() => {}} 
                                    className="form-checkbox h-4 w-4 text-emerald-600 rounded 
                                        border-gray-300 
                                        focus:ring-emerald-500 focus:border-emerald-500
                                        checked:bg-emerald-600 
                                        checked:border-emerald-600"
                                />
                                <span className={`
                                    text-xs font-medium 
                                    ${selected ? 'text-emerald-700' : 'text-gray-700'}
                                `}>
                                    {action.action}
                                </span>
                            </div>
                        ) : null;
                    })}
                </div>
            </div>
        ))}
    </div>
                </div>

                <div className="flex h-5 items-center space-x-4">
                    <CancelButton />
                    <Separator orientation="vertical" />
                    <SubmitButton label={item ? "Update role details" : "Create role"} isPending={isPending} />
                </div>
            </form>
        </Form>
    );
};

export default RoleForm;
