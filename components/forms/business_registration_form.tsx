"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { use, useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
    FormControl, FormDescription,
    FormField,
    FormItem, FormLabel,
    FormMessage,
} from "@/components/ui/form";

import {FormResponse} from "@/types/types";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {  useToast } from "@/hooks/use-toast"
import { BusinessSchema } from "@/types/business/schema";
import BusinessTypeSelector from "../widgets/business-type-selector";
import { createBusiness, fetchCountries } from "@/lib/actions/auth/business";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

const BusinessRegistrationForm = () => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();
    const [countries, setCountries] = useState([]);
    const router = useRouter();

    useEffect(() => {
        // fetchCountries().then((data) => {
        //     setCountries(data);
        //     console.log("Supported Countries within Settlo:", data);
        // });

        const getCountries = async () =>{
            try {
                const response = await fetchCountries();
                setCountries(response);
                console.log("Supported Countries within Settlo:", response);
            } catch (error) {
                console.error("Error fetching countries",error);
            }
        }
        getCountries();
    }, []);

    const form = useForm<z.infer<typeof BusinessSchema>>({
        resolver: zodResolver(BusinessSchema),
        defaultValues: {}
    });

    const onInvalid = useCallback(
        (errors: any) => {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: errors.message
                    ? errors.message
                    : "There was an issue submitting your form, please try later",
            });
        },
        [toast],
    );

    const submitData = (values: z.infer<typeof BusinessSchema>) => {
        setResponse(undefined);

        startTransition(() => {
            createBusiness(values).then((data) => {
                console.log("The data after creation is:", data)
                if (data){
                    setResponse(data);  
                }
            });
        });
    };

    return (
        <Form {...form}>
            <form
                className="space-y-8"
                onSubmit={form.handleSubmit(submitData, onInvalid)}
            >
                <div className="pt-8">
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Registration</CardTitle>
                                <CardDescription>
                                    Enter details for your business
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Where do you operate?"
                                                       
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
                            </CardContent>
                        </Card>
                      
                    </div>
                {
                    isPending ? (
                        <div>
                            <div>Loading...</div>
                        </div>
                    ): (
                        <Button type="submit" disabled={isPending} className={`mt-4 w-full`}>
                            Register Business
                    </Button>
                    )
                }
                </div>
            </form>
        </Form>
    );
};

export default BusinessRegistrationForm;
