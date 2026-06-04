"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  updateCategory,
} from "@/lib/actions/category-actions";
import {
  invalidateCategoriesCache,
  useCachedCategories,
} from "@/lib/cache/reference-data";
import type { Department } from "@/types/department/type";
import { Category } from "@/types/category/type";
import { CategorySchema } from "@/types/category/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import CategorySelector from "@/components/widgets/category-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CheckCircle2, FolderOpen, Trash2, X } from "lucide-react";

import styles from "./styles/form-shell.module.css";

type CategoryFormProps = {
  item: Category | null | undefined;
  departments: Department[];
  defaultDepartmentId?: string;
};

const CategoryForm = ({
  item,
  departments,
  defaultDepartmentId,
}: CategoryFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string>(item?.imageUrl || "");
  const { data: cachedCategoriesData } = useCachedCategories();
  const categories: Category[] | null = cachedCategoriesData ?? [];

  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!item;

  const form = useForm<z.infer<typeof CategorySchema>>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      imageUrl: imageUrl || item?.imageUrl || "",
      parentId: item?.parentId || "",
      departmentId: item?.departmentId ?? defaultDepartmentId ?? "",
      sortOrder: 0,
      active: item?.active ?? true,
    },
  });

  const showDepartmentPicker = departments.length > 1;

  // A category must belong to the same department as its parent, so once a
  // parent is chosen the department is locked to the parent's (set on
  // selection below). `watch` reflects the parent that's already set when
  // editing, so the lock holds on first render too.
  const selectedParentId = form.watch("parentId");
  const departmentLocked = !!selectedParentId;

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
    if (imageUrl) values.imageUrl = imageUrl;
    values.sortOrder = 0;

    startTransition(() => {
      if (item) {
        updateCategory(item.id, values, "category").then((data) => {
          if (data?.responseType === "success") {
            invalidateCategoriesCache();
            toast({ variant: "success", title: "Success", description: data.message });
          } else if (data?.responseType === "error") {
            toast({ variant: "destructive", title: "Error", description: data.message });
          }
        });
      } else {
        createCategory(values, "category").then((data) => {
          if (data?.responseType === "success") {
            invalidateCategoriesCache();
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/categories");
          } else if (data?.responseType === "error") {
            toast({ variant: "destructive", title: "Error", description: data.message });
          }
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <FolderOpen className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Category details</h3>
                <p className={styles.formCardHeadDesc}>
                  Groups products in the catalog. Optionally nest under a
                  parent or assign to a department.
                </p>
              </div>
              <div className={styles.formCardActions}>
                <span className={styles.stepBadge}>STEP 01</span>
              </div>
            </header>

            <div className={styles.formBody}>
              <div className="flex flex-col sm:flex-row gap-6">
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
                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      showDepartmentPicker ? "sm:grid-cols-3" : "sm:grid-cols-2"
                    }`}
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={styles.fieldLabel}>
                            Category name <span className="req">*</span>
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
                          <div className="flex items-center gap-2">
                            <FormLabel className={styles.fieldLabel}>
                              Parent category
                            </FormLabel>
                            {field.value ? (
                              <button
                                type="button"
                                onClick={() => field.onChange("")}
                                disabled={isPending}
                                title="Remove from parent category"
                                className="ml-auto inline-flex items-center gap-1 whitespace-nowrap font-mono text-[10px] tracking-[0.04em] text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                                Clear
                              </button>
                            ) : (
                              <span className="ml-auto font-mono text-[10px] tracking-[0.04em] text-muted-foreground">
                                OPTIONAL
                              </span>
                            )}
                          </div>
                          <FormControl>
                            <CategorySelector
                              simple
                              categories={categories}
                              onChange={(value) => {
                                field.onChange(value);
                                // Inherit (and lock to) the parent's
                                // department — every category carries one.
                                const parentDeptId = value
                                  ? categories?.find((c) => c.id === value)
                                      ?.departmentId
                                  : undefined;
                                if (parentDeptId) {
                                  form.setValue("departmentId", parentDeptId, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                }
                              }}
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

                    {showDepartmentPicker && (
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Department <span className="req">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending || departmentLocked}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((d) => (
                                  <SelectItem key={d.id} value={d.id}>
                                    {d.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {departmentLocked && (
                              <p className={styles.fieldHint}>
                                Set by the parent category — a category stays in
                                its parent&apos;s department.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Description
                          <span className="opt">OPTIONAL</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description"
                            rows={4}
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
            </div>
          </section>
        </div>

        <div className={styles.formFoot}>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                title="Discard changes and go back"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unsaved changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.back()}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isPending}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditing ? "Update category" : "Create category"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
