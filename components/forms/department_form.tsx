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
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { DepartmentSchema } from "@/types/department/schema";
import { createDepartment, updateDepartment } from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { Switch } from "../ui/switch";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tag } from "lucide-react";
import UploadImageWidget from "../widgets/UploadImageWidget";

function DepartmentForm({ item }: { item: Department | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error,] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");
  const [imageUrl, setImageUrl] = useState<string>(item && item.image?item.image: "");

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof DepartmentSchema>>({
    resolver: zodResolver(DepartmentSchema),
    defaultValues: {
      ...item,
      image: imageUrl ? imageUrl : (item && item.image?item.image: ""),
      status: item ? item.status : false,
  }
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Errors during form submission:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' && errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof DepartmentSchema>) => {
    if(imageUrl) values.image = imageUrl;
    startTransition(() => {
      if (item) {
        updateDepartment(item.id, values).then((data) => {
          if (data) setResponse(data);
          if (data && data.responseType === "success") {
            toast({
              title: "Success",
              description: data.message,
            });
            router.push("/departments");
          }
        });
      } else {
        createDepartment(values, 'department')
          .then((data) => {
            if (data) setResponse(data);
            if (data && data.responseType === "success") {
              toast({
                title: "Success",
                description: data.message,
              });
              router.push("/departments");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
      >
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <FormError message={error} />
          <FormSuccess message={success} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag w-5 h-5 />
                Department details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[110px_1fr] gap-6 items-start">
                            <div className="space-y-4">
                                <FormLabel className="block mt-2 mb-2">Depart Image</FormLabel>
                                <div className="bg-gray-50 rounded-lg p-4 content-center">
                                    <UploadImageWidget
                                        imagePath={'departments'}
                                        displayStyle={'default'}
                                        displayImage={true}
                                        showLabel={false}
                                        label="Image"
                                        setImage={setImageUrl}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                            <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter department name"
                          required
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Color</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter department color"
                          {...field}
                          type="color"
                          disabled={isPending}
                          value={field.value ?? ''}
                         />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {item && (
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="status"

                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <FormLabel>

                            Department Status
                            <span className={item.status ? "text-green-500" : "text-red-500"}>
                              ({item.status ? "Active" : "Inactive"})
                            </span>

                          </FormLabel>
                          <FormControl>
                            <Switch

                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )
                }
                </div>
                            </div>
            </div>
            </CardContent>
          </Card>

          <div className="flex h-5 items-center space-x-4 mt-4">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update department details" : "Add department"}
            />
          </div>
        </div>


      </form>
    </Form>
  );
}

export default DepartmentForm;
