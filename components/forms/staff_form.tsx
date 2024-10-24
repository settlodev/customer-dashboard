"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import { Separator } from "@/components/ui/separator";
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
import { createStaff, updateStaff } from "@/lib/actions/staff-actions";
import {Staff, StaffSchema} from "@/types/staff";
import {FormResponse} from "@/types/types";
import {Input} from "@/components/ui/input";
import {Switch} from "@radix-ui/react-switch";
import {Textarea} from "@/components/ui/textarea";
import CancelButton from "@/components/widgets/cancel-button";
import {SubmitButton} from "@/components/widgets/submit-button";
import GenderSelector from "@/components/widgets/gender-selector";
import { useToast } from "@/hooks/use-toast"

const StaffForm = ({ item }: { item: Staff | null | undefined }) => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [, setResponse] = useState<FormResponse | undefined>();

    const form = useForm<z.infer<typeof StaffSchema>>({
        resolver: zodResolver(StaffSchema),
        defaultValues: item
            ? item
            : { status: true },
    });

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description:typeof errors.message === 'string' && errors.message
                    ? errors.message
                    : "There was an issue submitting your form, please try later",
            });
        },
        [toast],
    );

    const submitData = (values: z.infer<typeof StaffSchema>) => {
        setResponse(undefined);

        startTransition(() => {
            if (item) {
                updateStaff(item.id, values).then((data) => {
                    if (data) setResponse(data);
                });
            } else {
                createStaff(values).then((data) => {
                    if (data) setResponse(data);
                });
            }
        });
    };

    return (
        <Form {...form}>
            <form
                className="space-y-8"
                onSubmit={form.handleSubmit(submitData, onInvalid)}
            >
                <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                    {/* Left Column */}
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal details</CardTitle>
                                <CardDescription>
                                    Enter personal details of the staff member
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter staff first name"
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
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter staff last name"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="emailAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter staff email address"
                                                        type="email"
                                                    />
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
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter phone number"
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
                                                            placeholder="Select staff gender"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="staffId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter staff id"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="jobTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter staff job title"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => {
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            const { ref: _ref, ...customSelectRef } = field;

                                            return (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={isPending}
                                                            placeholder="Enter staff location"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="department"
                                        render={({ field }) => {
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            const { ref: _ref, ...customSelectRef } = field;

                                            return (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={isPending}
                                                            placeholder="Enter staff department"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter employee's home address"
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nationality"
                                        render={({ field }) => {
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            const { ref: _ref, ...customSelectRef } = field;

                                            return (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            disabled={isPending}
                                                            placeholder="Enter staff nationality"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Staff status</FormLabel>
                                                    <FormDescription>
                                                        Is staff account enabled
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled
                                                        aria-readonly
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>HR notes</CardTitle>
                                <CardDescription>
                                    Any other notes relating to this employee
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Any other important details about the staff"
                                                        value={field.value ?? ""}
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
                    {/* Right Column */}
                    <div className="space-y-8">

                    </div>
                    <div className="flex h-5 items-center space-x-4">
                        <CancelButton />
                        <Separator orientation="vertical" />
                        <SubmitButton
                            isPending={isPending}
                            label={item ? "Update staff details" : "Add staff"}
                        />
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default StaffForm;
