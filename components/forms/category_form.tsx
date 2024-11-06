"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, {useEffect, useState, useTransition} from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "../ui/separator";

import {
    Form,
    FormControl,
    FormField,
    FormItem, FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {createCategory, fetchAllCategories, updateCategory} from "@/lib/actions/category-actions";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import {Category} from "@/types/category/type";
import {FormResponse} from "@/types/types";
import {CategorySchema} from "@/types/category/schema";
import {FormError} from "@/components/widgets/form-error";
import {Input} from "@/components/ui/input";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import ProductCategorySelector from "@/components/widgets/product-category-selector";
import ItemStatusSelector from "@/components/widgets/item-status-selector";
import {ItemStatuses} from "@/types/constants";

const CategoryForm = ({ item }: { item: Category | null | undefined }) => {
    console.log("item is:", item);
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    //const [isActive, setIsActive] = React.useState(item ? item.status : true);
    const [imageUrl, setImageUrl] = useState<string>(item && item.image?item.image: "");
    const [categories, setCategories] = useState<Category[] | null>([]);
    const [status, setStatus] = useState<string>(JSON.stringify(item?item.status: ItemStatuses[0].value));

    useEffect(() => {
        const getData = async () => {
            const categories = await fetchAllCategories();
            setCategories(categories);
        }
        getData();
    }, []);

    const selectStatus = (item: string)=>{
        //const myItem = JSON.parse(item);
        setStatus(item);
    }
    const form = useForm<z.infer<typeof CategorySchema>>({
        resolver: zodResolver(CategorySchema),
        defaultValues: {
            ...item,
            image: imageUrl ? imageUrl : (item && item.image?item.image: ""),
            parentId: item?.parentId || "",
            status: status
        }
    });

    const submitData = (values: z.infer<typeof CategorySchema>) => {
        setResponse(undefined);

        if(imageUrl) {
            values.image = imageUrl;
        }

        values.status = JSON.parse(status);

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
            <form className="space-y-8]" onSubmit={form.handleSubmit(submitData)}>
                <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                        <div className="mt-4 flex">
                            <UploadImageWidget
                                imagePath={'categories'}
                                displayStyle={'default'}
                                displayImage={true}
                                showLabel={false}
                                label="Image"
                                setImage={setImageUrl}
                            />
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Category Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter category name"
                                                    {...field}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="parentId"
                                render={({field}) => (

                                    <FormItem>
                                        <FormLabel>Parent Category</FormLabel>
                                        <FormControl>
                                            <ProductCategorySelector
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                isRequired
                                                isDisabled={isPending}
                                                label="Category"
                                                placeholder="Select category"
                                                categories={categories}
                                                value={item && item.parentId?item.parentId: ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>

                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({field}) => (

                                    <FormItem>
                                        <FormLabel>Category Status </FormLabel>
                                        <FormControl>
                                            <ItemStatusSelector
                                                onChange={selectStatus}
                                                onBlur={field.onBlur}
                                                isRequired
                                                isDisabled={isPending}
                                                label="Status"
                                                value={JSON.stringify(status)}
                                                placeholder="Select Status"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>

                                )}
                            />

                            {/*<FormField
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
                                                    <p className="text-sm">Category status</p>
                                                    <p className="text-tiny text-default-400">
                                                        Category will be visible on your POS devices
                                                    </p>
                                                </div>
                                            </Switch>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />*/}
                        </div>

                        <div className="flex h-5 items-center space-x-4">
                            <CancelButton/>
                            <Separator orientation="vertical"/>
                            <SubmitButton
                                isPending={isPending}
                                label={item ? "Update category details" : "Create category"}
                            />
                        </div>
                    </div>
                    </div>
            </form>
        </Form>
);
};

export default CategoryForm;
