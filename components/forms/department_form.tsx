"use client";

import { Input } from "@/components/ui/input";
import { FieldErrors, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import { Button } from "@/components/ui/button";
import { FormError } from "../widgets/form-error";
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
import { DepartmentSchema } from "@/types/department/schema";
import { createDepartment, updateDepartment } from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { useRouter } from "next/navigation";
import { Textarea } from "../ui/textarea";
import UploadImageWidget from "../widgets/UploadImageWidget";
import {
  CheckCircle2,
  FolderTree,
  LayoutGrid,
  List,
  Trash2,
} from "lucide-react";

import styles from "./styles/form-shell.module.css";

function DepartmentForm({ item }: { item: Department | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState<string>(item?.image || "");

  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!item;

  const form = useForm<z.infer<typeof DepartmentSchema>>({
    resolver: zodResolver(DepartmentSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      color: item?.color ?? "",
      image: item?.image ?? "",
      order: item?.order ?? undefined,
      defaultPosView: item?.defaultPosView ?? "GRID",
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

  const submitData = (values: z.infer<typeof DepartmentSchema>) => {
    if (imageUrl) values.image = imageUrl;

    startTransition(async () => {
      try {
        let result: FormResponse | void;
        if (item) {
          result = await updateDepartment(item.id, values);
        } else {
          result = await createDepartment(values);
        }
        if (result) {
          if (result.responseType === "success") {
            toast({ variant: "success", title: "Success", description: result.message });
            router.push("/departments");
          } else {
            setResponse(result);
          }
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred.",
        });
      }
    });
  };

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formStack}>
          <section className={styles.formCard}>
            <header className={styles.formCardHead}>
              <div className={styles.icoBox}>
                <FolderTree className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Department details</h3>
                <p className={styles.formCardHeadDesc}>
                  Top-level grouping shown in the POS and reports.
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
                      imagePath="departments"
                      displayStyle="default"
                      displayImage={true}
                      showLabel={true}
                      label="Department image"
                      setImage={setImageUrl}
                      image={imageUrl}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Department name <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter department name"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={styles.fieldLabel}>Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={field.value || "#6b7280"}
                                onChange={field.onChange}
                                disabled={isPending}
                                className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 p-0.5 shrink-0"
                              />
                              <Input
                                placeholder="#000000"
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={isPending}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={styles.fieldLabel}>
                            Display order
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 1"
                              {...field}
                              value={field.value ?? ""}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultPosView"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={styles.fieldLabel}>
                            Default POS view
                          </FormLabel>
                          <FormControl>
                            <div className="flex h-10 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => field.onChange("GRID")}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                                  field.value === "GRID"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                <LayoutGrid className="h-4 w-4" />
                                Grid
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => field.onChange("LIST")}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                                  field.value === "LIST"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                <List className="h-4 w-4" />
                                List
                              </button>
                            </div>
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
                        <FormLabel className={styles.fieldLabel}>
                          Description
                          <span className="opt">OPTIONAL</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe this department"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isPending}
                            rows={4}
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
            {isEditing ? "Update department" : "Create department"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default DepartmentForm;
