"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import CancelButton from "../widgets/cancel-button";
import { SubmitButton } from "../widgets/submit-button";
import { Separator } from "@/components/ui/separator";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { createKDS, updateKDS } from "@/lib/actions/kds-actions";
import { KDSSchema } from "@/types/kds/schema";
import { KDS } from "@/types/kds/type";
import { fectchAllDepartments } from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

function KDSForm({ item }: { item: KDS | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error, ] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);


  useEffect(() => {
    const getDepartments = async () => {
      try {
        const response = await fectchAllDepartments();
        setDepartments(response);
      } catch (error) {
        console.error("Error fetching departments", error);
      }
    };
    getDepartments();
  }, []);

  const form = useForm<z.infer<typeof KDSSchema>>({
    resolver: zodResolver(KDSSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description:typeof errors.message === 'string' && errors.message
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof KDSSchema>) => {
    startTransition(() => {
      if (item) {
        updateKDS(item.id, values)
        .then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createKDS(values)
          .then((data) => {
            console.log(data);
            if (data) setResponse(data);
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
        className={`gap-1`}
      >
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>KDS Details</CardTitle>
              <CardDescription>
                Enter the details of KDS
              </CardDescription>
            </CardHeader>
            <CardContent>
            <FormError message={error}/>
            <FormSuccess message={success}/>
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KDS Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter supplier first name "
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
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departments</FormLabel>
                      <FormControl>
                        <Select
                          disabled={isPending || departments.length === 0}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.length > 0
                              ? departments.map((dept: Department, index: number) => (
                                  <SelectItem key={index} value={dept.id}>
                                    {dept.name}{" "}
                                  </SelectItem>
                                ))
                              : null}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />  
              </div>
            </CardContent>
          </Card>
          <div className="flex h-5 items-center space-x-4 mt-4">
            <CancelButton />
            <Separator orientation="vertical" />
            <SubmitButton
              isPending={isPending}
              label={item ? "Update KDS details" : "Add KDS"}
            />
          </div>
        </div>

      </form>
    </Form>
  );
}

export default KDSForm;


