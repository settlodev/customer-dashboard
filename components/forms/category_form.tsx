"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@nextui-org/switch";
import { cn } from "@nextui-org/react";

import { Separator } from "../ui/separator";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { createCategory, updateCategory } from "@/lib/actions/category-actions";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import {Category} from "@/types/category/type";
import {FormResponse} from "@/types/types";
import {CategorySchema} from "@/types/category/schema";
import {FormError} from "@/components/widgets/form-error";
import {Input} from "@/components/ui/input";

const CategoryForm = ({ item }: { item: Category | null | undefined }) => {
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    const [isActive, setIsActive] = React.useState(item ? item.status : true);

    const form = useForm<z.infer<typeof CategorySchema>>({
        resolver: zodResolver(CategorySchema),
        defaultValues: {
            ...item,
            image: item?.image || "",
            parentId: item?.parentId || "",
            status: item ? item.status : true,
        },
    });

    const submitData = (values: z.infer<typeof CategorySchema>) => {
        setResponse(undefined);

        startTransition(() => {
            if (item) {
                const updatedValues = {
                    ...values,
                    parentId: values.parentId || item.parentId || "",
                };
                console.log("Updated values:", updatedValues);

                updateCategory(item.id, updatedValues).then((data) => {
                    if (data) setResponse(data);
                });
            } else {
                createCategory(values).then((data) => {
                    if (data) setResponse(data);
                });
            }
        });
    };

    return (
        <Form {...form}>
            <FormError message={response?.message} />
            <form className="space-y-8" onSubmit={form.handleSubmit(submitData)}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="Enter category full name (eg. Hair)"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="Upload image to represent the category"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="parentId"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="Select parent category"
                                        value={field.value || ''}
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
                                            <p className="text-sm">Category status</p>
                                            <p className="text-tiny text-default-400">
                                                Category will be visible on your POS devices
                                            </p>
                                        </div>
                                    </Switch>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex h-5 items-center space-x-4">
                    <CancelButton />
                    <Separator orientation="vertical" />
                    <SubmitButton
                        isPending={isPending}
                        label={item ? "Update category details" : "Create category"}
                    />
                </div>
            </form>
        </Form>
    );
};

export default CategoryForm;
