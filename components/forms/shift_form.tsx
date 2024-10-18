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
  FormDescription,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Shift } from "@/types/shift/type";
import { ShiftSchema } from "@/types/shift/schema";
import { createShift, updateShift } from "@/lib/actions/shift-actions";
import { fectchAllDepartments } from "@/lib/actions/department-actions";
import { Department } from "@/types/department/type";

function ShiftForm({ item }: { item: Shift | null | undefined }) {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error, ] = useState<string | undefined>("");
  const [success, ] = useState<string | undefined>("");
  const [departments, setDepartments] = useState<Department[]>(
    []
  );
  const { toast } = useToast();

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

  const form = useForm<z.infer<typeof ShiftSchema>>({
    resolver: zodResolver(ShiftSchema),
    defaultValues: item ? item : { status: true },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log("Errors during form submission:", errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description: typeof errors.message === 'string' ? errors.message : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof ShiftSchema>) => {

    console.log("Submitting data:", values);
    startTransition(() => {
      if (item) {
        updateShift(item.id, values).then((data) => {
          if (data) setResponse(data);
        });
      } else {
        createShift(values)
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
              <CardTitle>Shift Details</CardTitle>
              <CardDescription>
                Add shift to your business location
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
                      <FormLabel>Shift Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter shift name"
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
                            <SelectValue placeholder={departments.length > 0 ? "Select a department": "No departments found"} />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.length > 0
                              ? departments.map((dept: Department, index: number) => (
                                  <SelectItem key={index} value={dept.id}>
                                    {dept.name}{" "}
                                  </SelectItem>
                                ))
                              : null
                              }
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

            <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="HH:MM (24 hour format)"
                            pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                            title="Please enter time in 24-hour format (HH:mm)"
                          />
                        </FormControl>
                        <FormDescription>
                        When does the shift start
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ending Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="HH:MM (24 hour format)"
                            pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                            title="Please enter time in 24-hour format (HH:mm)"
                          />
                        </FormControl>
                        <FormDescription>
                        When does the shift end
                        </FormDescription>
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
              label={item ? "Update shift details" : "Add shift "}
            />
          </div>
        </div>

        {/* </div> */}
      </form>
    </Form>
  );
}

export default ShiftForm;


