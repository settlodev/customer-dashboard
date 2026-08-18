"use client";

import { FieldErrors, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  ControlInput,
  ControlTextarea,
  FieldLabel,
} from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Brand } from "@/types/brand/type";
import { BrandSchema } from "@/types/brand/schema";
import { createBrand, updateBrand } from "@/lib/actions/brand-actions";
import { invalidateBrandsCache } from "@/lib/cache/reference-data";
import { useRouter } from "next/navigation";
import UploadImageWidget from "../widgets/UploadImageWidget";
import { CheckCircle2, Tag, Trash2 } from "lucide-react";

import styles from "./styles/form-shell.module.css";

function BrandForm({ item }: { item: Brand | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string>(item?.imageUrl || "");
  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!item;

  const form = useForm<z.infer<typeof BrandSchema>>({
    resolver: zodResolver(BrandSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      imageUrl: item?.imageUrl ?? "",
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

  const submitData = (values: z.infer<typeof BrandSchema>) => {
    if (imageUrl) values.imageUrl = imageUrl;

    startTransition(() => {
      if (item) {
        updateBrand(item.id, values).then((data) => {
          if (data && data.responseType === "success") {
            invalidateBrandsCache();
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/brands");
          }
        });
      } else {
        createBrand(values)
          .then((data) => {
            if (data && data.responseType === "success") {
              invalidateBrandsCache();
              toast({ variant: "success", title: "Success", description: data.message });
              router.push("/brands");
            }
          })
          .catch(() => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "An unexpected error occurred.",
            });
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
                <Tag className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3>Brand details</h3>
                <p className={styles.formCardHeadDesc}>
                  Manufacturer or label tied to products for filtering and reporting.
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
                      imagePath="brands"
                      displayStyle="default"
                      displayImage={true}
                      showLabel={true}
                      label="Brand image"
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
                      <FormItem className="space-y-[7px]">
                        <FieldLabel required>Brand name</FieldLabel>
                        <FormControl>
                          <ControlInput
                            placeholder="Enter brand name"
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
                      <FormItem className="space-y-[7px]">
                        <FieldLabel optional>Description</FieldLabel>
                        <FormControl>
                          <ControlTextarea
                            placeholder="Brief description of the brand"
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
            {isEditing ? "Update brand" : "Create brand"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default BrandForm;
