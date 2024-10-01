"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
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
import { toast, useToast } from "@/hooks/use-toast"
import { BusinessSchema } from "@/types/business/schema";
import BusinessTypeSelector from "../widgets/business-type-selector";
import { createBusiness } from "@/lib/actions/auth/business";
import { Button } from "../ui/button";
import { error } from "console";
import { LocationSchema } from "@/types/location/schema";

const LocationForm = () => {
    
    const [isPending, startTransition] = useTransition();
    const [response, setResponse] = useState<FormResponse | undefined>();

    const form = useForm<z.infer<typeof LocationSchema>>({
        resolver: zodResolver(LocationSchema),
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

    const submitData = useCallback(
        (values: z.infer<typeof LocationSchema>) => {
            console.log("submitData called");
            console.log("Submitting values are:", values)
            startTransition(() => {
                createBusinessLocation(values).then((data) => {
                    if (data){
                        console.log("data is:", data)
                        setResponse(data);
                       if(data.responseType === "success"){
                        toast({
                            variant: "default",
                            title: "Business created successfully",
                            description:data.message,
                            
                        })
                       }
                       else if(data.responseType === "error"){
                        toast({
                            variant: "destructive",
                            title: "Uh oh! Something went wrong.",
                            description:data.message
                        })
                       }
                    } 
                       
                });
            });
        },
        [toast]
    )

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
                                <CardTitle>Setup Business Location</CardTitle>
                                <CardDescription>
                                    Setup your business locations,if you have multiple locations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 grid-rows-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter location business name"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter location business phone number"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        type="email"
                                                        placeholder="Enter location business email"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location Address</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter business location address"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                  {/* <FormField
                                        control={form.control}
                                        name=""
                                        render={({ field }) => (
                                            <FormItem>
                                         
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
                                    /> */}

                                
                                  
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Which city do you operate?"
                                                       
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    /> 
                                      <FormField
                                        control={form.control}
                                        name="region"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Region</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Which region do you operate?"
                                                       
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    /> 
                                      <FormField
                                        control={form.control}
                                        name="street"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Street</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Which street do you operate?"
                                                       
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    /> 
                                      <FormField
                                        control={form.control}
                                        name="openingTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Opening Time</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="When do you open your business location?"
                                                       
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />  
                                      <FormField
                                        control={form.control}
                                        name="closingTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Closing Time</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="When do you close your business location?"
                                                       
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
                                                <FormLabel>Description of your</FormLabel>
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
                
                    <Button type="submit" disabled={isPending} className={`mt-4 w-full`}>
                            Setup Location
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default LocationForm;
