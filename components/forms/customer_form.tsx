"use client"


import {Card, CardContent, CardDescription, CardHeader, CardTitle,CardFooter} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useForm} from "react-hook-form";
import {Form, FormControl,FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import React, {useCallback, useState, useTransition} from "react";
import {CustomerSchema} from "@/types/customer/schema";
import {createCustomer, updateCustomer} from "@/lib/actions/customer-actions";
import {Customer} from "@/types/customer/type";
import {toast, useToast} from "@/hooks/use-toast";
import {FormResponse} from "@/types/types";
import GenderSelector from "@/components/widgets/gender-selector";

function CustomerForm({item}:{item:Customer | null | undefined}) {
    const [isPending, startTransition] = useTransition();
    const [response,setResponse] = useState<FormResponse | undefined>()
    const {toast} = useToast()
    const form = useForm<z.infer<typeof CustomerSchema>>({
        resolver: zodResolver(CustomerSchema),
        defaultValues:item ? item : {status:true}
    });

    const onInvalid = useCallback(
        (errors:any) =>{
            toast({
                variant: "destructive",
                title:"Uh oh! something went wrong",
                description:errors.message
                    ? errors.message
                    : "There was an issue submitting your form, please try later"
            })
        },
        [toast]
    )

    const submitData = useCallback(
        (values: z.infer<typeof CustomerSchema>) => {
            startTransition(() => {
                if(item){
                    updateCustomer(item.id,values).then((data) =>{
                        if (data) setResponse(data)
                        })
                }
                else {
                    createCustomer(values)
                        .then((data) => {
                            console.log(data);
                            if(data) setResponse(data)
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }
            });
        },
        []
    );
    return (
        <Card className="mx-auto max-w-sm mt-10">
            <CardHeader>
                <CardTitle className="text-2xl">Create Customer</CardTitle>
                <CardDescription>
                    Create a new customer
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submitData,onInvalid)} className={`gap-1`}>
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter customer first name "
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
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter customer last name"
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="johndoe@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer Phone Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter customer phone number"
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
                            name="gender"
                            render={({ field }) => {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { ref: _ref, ...customSelectRef } = field;

                                return (
                                    <FormItem>
                                        <FormControl>
                                            <GenderSelector
                                                {...customSelectRef}
                                                isRequired
                                                isDisabled={isPending}
                                                label="Gender"
                                                placeholder="Select customer gender"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Location</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter customer location"
                                            {...field}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isPending} className={`mt-4 w-full`}>
                            Submit
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex justify-end">

            </CardFooter>
        </Card>
    );
}

export default CustomerForm
