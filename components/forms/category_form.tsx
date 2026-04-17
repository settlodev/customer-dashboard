"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
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
import {
  createCategory,
  fetchAllCategories,
  updateCategory,
} from "@/lib/actions/category-actions";
import CancelButton from "@/components/widgets/cancel-button";
import { SubmitButton } from "@/components/widgets/submit-button";
import { Category } from "@/types/category/type";
import { FormResponse } from "@/types/types";
import { CategorySchema } from "@/types/category/schema";
import { FormError } from "@/components/widgets/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import CategorySelector from "@/components/widgets/category-selector";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";
import { useRouter } from "next/navigation";
const CategoryForm = ({ item }: { item: Category | null | undefined }) => {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState<string>(item?.imageUrl || "");
  const [categories, setCategories] = useState<Category[] | null>([]);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const cats = await fetchAllCategories();
      setCategories(cats);
    };
    getData();
  }, []);

  const form = useForm<z.infer<typeof CategorySchema>>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      imageUrl: imageUrl || item?.imageUrl || "",
      parentId: item?.parentId || "",
      sortOrder: item?.sortOrder ?? 0,
      active: item?.active ?? true,
    },
  });

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

  const submitData = (values: z.infer<typeof CategorySchema>) => {
    setResponse(undefined);
    if (imageUrl) values.imageUrl = imageUrl;

    startTransition(() => {
      if (item) {
        updateCategory(item.id, values, "category").then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({
              variant: "success",
              title: "Success",
              description: data.message,
            });
          }
        });
      } else {
        createCategory(values, "category").then((data) => {
          if (data) setResponse(data);
          if (data?.responseType === "success") {
            toast({
              variant: "success",
              title: "Success",
              description: data.message,
            });
            router.push("/categories");
          }
        });
      }
    });
  };

  return (
    <Form {...form}>
      {/*<FormError message={response?.message} />*/}
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Image */}
              <div className="flex-shrink-0 self-start">
                <div className="w-[200px] h-[200px]">
                  <UploadImageWidget
                    imagePath="categories"
                    displayStyle="default"
                    displayImage={true}
                    showLabel={true}
                    label="Category image"
                    setImage={setImageUrl}
                    image={imageUrl}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Category name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter category name"
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
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent category</FormLabel>
                        <FormControl>
                          <CategorySelector
                            simple
                            categories={categories}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isDisabled={isPending}
                            placeholder="Select parent"
                            value={field.value || ""}
                            showChildren={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                              )
                            }
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description"
                          rows={5}
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update category" : "Create category"}
          />
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
