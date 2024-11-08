"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, {useEffect, useRef, useState, useTransition} from "react";
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
import {FormResponse, PrivilegeActionItem, PrivilegeItem} from "@/types/types";
import {RoleSchema} from "@/types/roles/schema";
import {FormError} from "@/components/widgets/form-error";
import {Role} from "@/types/roles/type";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {fetchAllSections} from "@/lib/actions/privileges-actions";
import _ from "lodash";
import {UUID} from "node:crypto";

const RoleForm = ({ item }: { item: Role | null | undefined }) => {
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    const [isActive, setIsActive] = useState(item ? item.status : true);
    const [privileges, setPrivileges] = useState<PrivilegeItem[]>([]);
    const [sections, setSections] = useState<PrivilegeItem[]>([]);
    const [role, setRole] = useState<Role|null>(null);

    const form = useForm<z.infer<typeof RoleSchema>>({
        resolver: zodResolver(RoleSchema),
        defaultValues: item ? item : { status: true },
    });

    const submitData = (values: z.infer<typeof RoleSchema>) => {
        setResponse(undefined);

        startTransition(() => {
            if (item) {
                updateRole(item.id, values).then((data) => {
                    if (data) setResponse(data);
                });
            } else {
                createRole(values).then((data) => {
                    if (data) setResponse(data);
                });
            }
        });
    };

    const initialized = useRef(false);

    useEffect(()=>{
        async function getData(){
            if (!initialized.current) {
                initialized.current = true
                const data = await fetchAllSections();
                console.log("data is:", data);
                console.log("privs is:", privileges);
                setPrivileges(data);
            }
        }
        getData();
    },[]);

    const selectAction= (role: UUID | undefined, section_id: string, action_id: string)=>{
        const the_priv = {
            "role_id": role?role: null,
            "section_id": section_id,
            "action_id": action_id};
        if (!_.find(privileges, the_priv)) {
            const privs = [...privileges, the_priv];
            setPrivileges(privs);
        }
    }

    return (
        <Form {...form}>
            <FormError message={response?.message} />
            <form className="space-y-8" onSubmit={form.handleSubmit(submitData)}>
                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Role Name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        // isRequired
                                        // isDisabled={isPending}
                                        // label="Role name"
                                        placeholder="Enter role name"
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({field}) => (
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
                                                //selected
                                                "group-data-[selected=true]:ml-6",
                                                // pressed
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
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({field}) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    // isDisabled={isPending}
                                    // label="Role description"
                                    placeholder="Enter a short description of the role"
                                    // radius="sm"
                                />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <div className='popup-content'>
                    <>
                        <div className='input-row input-row-multiple'>
                            <h4 style={{paddingBottom: 10}}>Select Privileges</h4>
                            <div>
                                {sections?.map((priv, index) => {
                                        return (
                                            <div
                                                key={index} style={{paddingBottom: 10}}>
                                                <p key={index}
                                                    style={{paddingBottom: 5, fontWeight: "bold", color: "#860037"}}>
                                                    {priv.name}
                                                </p>
                                                {priv.privilegeActions.map((action: PrivilegeActionItem, i) => {
                                                        const obj =
                                                            {
                                                                role_id: role?.id,
                                                                section_id: priv.id,
                                                                action_id: action.id
                                                            };
                                                        const selected = _.find(privileges, obj, 0);
                                                        return action.name ? (
                                                            <label
                                                                onClick={() => selectAction(role?.id, priv.id, action.id)}
                                                                key={i}
                                                                style={{textTransform: "capitalize", paddingRight: 0, width: "20%"}}>
                                                                {role ? (
                                                                    <input checked={selected} type={"checkbox"} value={action.id}/>
                                                                ) : (
                                                                    <input type={"checkbox"} value={action.id}/>
                                                                )}
                                                                <span>{" "}{action.name}</span>
                                                            </label>
                                                        ) : (<></>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    </>
                </div>

                <div className="flex h-5 items-center space-x-4">
                    <CancelButton/>
                    <Separator orientation="vertical"/>
                    <SubmitButton
                        isPending={isPending}
                        label={item ? "Update role details" : "Create role"}
                    />
                </div>
            </form>
        </Form>
    );
};

export default RoleForm;
