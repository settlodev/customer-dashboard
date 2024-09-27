"use client"


import {Card, CardContent, CardDescription, CardHeader, CardTitle,CardFooter} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useForm} from "react-hook-form";
import {Form, FormControl,FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {useCallback, useTransition} from "react";
import {CustomerSchema} from "@/types/data-schemas";
import {createCustomer} from "@/lib/actions/customer-actions";

function CustomerForm() {
    const [isPending, startTransition] = useTransition();
    const form = useForm<z.infer<typeof CustomerSchema>>({
        resolver: zodResolver(CustomerSchema),
        defaultValues: {

        },
    });

    const submitData = useCallback(
        (values: z.infer<typeof CustomerSchema>) => {
            startTransition(() => {
                createCustomer(values)
                    .then((data) => {
                        console.log(data);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
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
                    <form onSubmit={form.handleSubmit(submitData)} className={`gap-1`}>
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john" {...field} />
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
                                        <Input placeholder="doe" {...field} />
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
                                        <Input placeholder="0694230173" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="kinondoni" {...field} />
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
