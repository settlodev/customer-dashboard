"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BusinessSchema } from "@/types/business/schema";
import BusinessTypeSelector from "../widgets/business-type-selector";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loader2Icon } from "lucide-react";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { fetchCountries } from "@/lib/actions/countries-actions";
import { createBusiness } from "@/lib/actions/auth/business";
import { Business } from "@/types/business/type";
const BusinessRegistrationForm = () => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [countries, setCountries] = useState<Business[]>([]);
  const [error, setError] = useState<string | undefined>("");
  const [success,] = useState<string | undefined>("");

  useEffect(() => {
    const getCountries = async () => {
      try {
        const response = await fetchCountries();
        setCountries(response);
        console.log("Supported Countries within Settlo:", response);
      } catch (error) {
        console.error("Error fetching countries", error);
      }
    };
    getCountries();
  }, []);


  const form = useForm<z.infer<typeof BusinessSchema>>({
    resolver: zodResolver(BusinessSchema),
    defaultValues: {},
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: typeof errors.message === 'string'
          ? errors.message
          : "There was an issue submitting your form, please try later",
      });
    },
    [toast]
  );

  const submitData = (values: z.infer<typeof BusinessSchema>) => {
    setResponse(undefined);

    startTransition(() => {
      createBusiness(values)
        .then(async (data) => {

          if (data && "id" in data) {
          } else if (data && data.responseType === "error") {
            setError(data.message);
          } else {
            setError("An unexpected error occurred. Please try again.");
          }
        })
        .catch((error) => {
          setError(
            "An unexpected error occurred. Please try again." +
              (error instanceof Error ? " " + error.message : "")
          );
        });
    });
  };


  return (

        <Card className="mx-auto max-w-sm lg:max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl lg:text-3xl">Business Registration</CardTitle>
            <CardDescription className="text-[18px]">Enter details for your business</CardDescription>
          </CardHeader>
          <CardContent>
          <FormError message={error}/>
          <FormSuccess message={success}/>
            <Form {...form}>
              <form
                className="space-y-8"
                onSubmit={form.handleSubmit(submitData, onInvalid)}
              >
                <div className="grid grid-cols-1 grid-rows-1 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Enter business name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        {/* <FormLabel>Business Type</FormLabel> */}
                        <FormControl>
                          <BusinessTypeSelector
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isRequired
                            isDisabled={isPending}
                            label="Business Type"
                            placeholder="Select business type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Select
                            disabled={isPending || countries.length === 0}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.length > 0
                                ? countries.map(
                                    (country: Business, index: number) => (
                                      <SelectItem
                                        key={index}
                                        value={country.id}
                                      >
                                        {country.name}{" "}
                                        {/* Assuming 'name' is the country name */}
                                      </SelectItem>
                                    )
                                  )
                                : null}
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={isPending}
                            placeholder="Describe your business"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {isPending ? (
                  <div className="flex justify-center items-center bg-black rounded p-2 text-white">
                    <Loader2Icon className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <Button
                    type="submit"
                    disabled={isPending}
                    className={`mt-4 w-full`}
                  >
                    Register Business
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

  );
};

export default BusinessRegistrationForm;
