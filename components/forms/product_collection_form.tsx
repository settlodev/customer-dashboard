"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { ProductCollection } from "@/types/product-collection/type";
import { ProductCollectionSchema } from "@/types/product-collection/schema";
import {
  createProductCollection,
  updateProductCollection,
} from "@/lib/actions/product-collection-actions";
import { useRouter } from "next/navigation";
import { Switch } from "../ui/switch";
import { Card, CardContent } from "../ui/card";
import UploadImageWidget from "../widgets/UploadImageWidget";
import { MultiSelect } from "../ui/multi-select";
import { fetchAllProducts } from "@/lib/actions/product-actions";
import { Product } from "@/types/product/type";

function ProductCollectionForm({
  item,
}: {
  item: ProductCollection | null | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchAllProducts();
        setProducts(data);
      } catch {
        // Products will remain empty, selector will show empty state
      }
    };
    loadProducts();
  }, []);

  const existingProductIds = item?.products?.map((p) => p.productId) ?? [];

  const form = useForm<z.infer<typeof ProductCollectionSchema>>({
    resolver: zodResolver(ProductCollectionSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      imageUrl: imageUrl || item?.imageUrl || "",
      active: item?.active ?? true,
      productIds: existingProductIds,
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

  const submitData = (values: z.infer<typeof ProductCollectionSchema>) => {
    if (imageUrl) values.imageUrl = imageUrl;

    startTransition(() => {
      if (item) {
        updateProductCollection(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({ variant: "success", title: "Success", description: data.message });
            router.push("/product-collections");
          }
        });
      } else {
        createProductCollection(values)
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({ variant: "success", title: "Success", description: data.message });
              router.push("/product-collections");
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

  const productOptions = products.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  return (
    <Form {...form}>
      <FormError message={response?.message} />
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <UploadImageWidget
                  imagePath="collections"
                  displayStyle="default"
                  displayImage={true}
                  showLabel={true}
                  label="Collection image"
                  setImage={setImageUrl}
                  image={imageUrl}
                />
              </div>

              <div className="lg:col-span-2 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Collection Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter collection name"
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
                          placeholder="Brief description of this collection"
                          rows={3}
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

            <Separator />

            <FormField
              control={form.control}
              name="productIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Products <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={productOptions}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Select products for this collection"
                      maxCount={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {item && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4">Settings</h3>
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex justify-between items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            Collection Status
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {field.value
                              ? "This collection is currently active and visible"
                              : "This collection is currently inactive and hidden"}
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
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 pt-2 pb-4 sm:pb-0">
          <CancelButton />
          <Separator orientation="vertical" className="h-5" />
          <SubmitButton
            isPending={isPending}
            label={item ? "Update collection" : "Create collection"}
          />
        </div>
      </form>
    </Form>
  );
}

export default ProductCollectionForm;
