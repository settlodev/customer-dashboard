"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState, useTransition } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import * as z from "zod";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { FormResponse } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { Building2, Facebook, Instagram, Loader2Icon, Mail, MapPin, X, Youtube} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CancelButton from "../widgets/cancel-button";
import { Separator } from "../ui/separator";
import { Business } from "@/types/business/type";
import { BusinessSchema } from "@/types/business/schema";
import { updateBusiness } from "@/lib/actions/business-actions";
import BusinessTypeSelector from "../widgets/business-type-selector";
import CountrySelector from "../widgets/country-selector";
import { BusinessType } from "@/types/enums";
// import UploadImageWidget from "../widgets/UploadImageWidget";
const BusinessForm = ({ item, onSubmit, submitButtonText = 'Setup business' }: { item: Business | null | undefined; onSubmit: (values: z.infer<typeof BusinessSchema>) => void; submitButtonText?: string }) => {
 
    const [isPending, startTransition] = useTransition();
    const [, setResponse] = useState<FormResponse | undefined>();
    // const [businessLicense,setBusinessLicense,] = useState<string | undefined>(item ? item.businessLicense : '');

    const form = useForm<z.infer<typeof BusinessSchema>>({
        resolver: zodResolver(BusinessSchema),
        defaultValues: {
            ...item,
            status: item ? item.status : true,
            businessType: item ? item.businessType : BusinessType.RETAIL,
            // image: item ? item.image : '',
            logo: item ? item.logo : undefined,
            notificationPhone: item ? item.notificationPhone : undefined,
            notificationEmailAddress: item ? item.notificationEmailAddress : undefined,
            vrn: item ? item.vrn : undefined,
            uin: item ? item.uin : undefined,
            serial: item ? item.serial : undefined,
            memarts: item ? item.memarts : undefined,
            businessLicense: item ? item.businessLicense : '',
            certificateOfIncorporation: item ? item.certificateOfIncorporation : null,
            identificationNumber: item ? item.identificationNumber : '',
            businessIdentificationDocument: item ? item.businessIdentificationDocument : null,
            receiptPrefix: item ? item.receiptPrefix : null,
            receiptSuffix: item ? item.receiptSuffix : null,
            receiptImage: item ? item.receiptImage : null,
            website: item ? item.website : null,
            vfdRegistrationState: item ? item.vfdRegistrationState : false
        },
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
        [],
    );
    const submitData = (values: z.infer<typeof BusinessSchema>) => {


        setResponse(undefined);

        startTransition(() => {
            if (item) {
                // console.log("Updating existing business with ID:", item);
                updateBusiness(item.id, values).then((data) => {
                    if (data) setResponse(data);
                });
            } else {
                
                onSubmit(values)
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submitData, onInvalid)} className="mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Business Name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    className="pl-10"
                                                    {...field}
                                                    disabled={isPending}
                                                    placeholder="Eg. Mark Juices Sinza"
                                                />
                                            </div>
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
                                        <FormLabel>Business Type</FormLabel>
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
                                            <CountrySelector
                                                {...field}
                                                isDisabled={isPending}
                                                label="Select business country"
                                                placeholder="Select country"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

<FormField
                                control={form.control}
                                name="notificationEmailAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notification Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    className="pl-10"
                                                    {...field}
                                                    disabled={isPending}
                                                    value={field.value || ''}
                                                // onChange={}
                                                />
                                            </div>
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
                                                {...field}
                                                disabled={isPending}
                                                value={field.value || ""}
                                                placeholder="Describe your business location"
                                                className="min-h-[100px]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

               

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Social Media Links
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="instagram"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instagram</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    className="pl-10"
                                                    {...field}
                                                    disabled={isPending}
                                                    value={field.value || ''}
                                                // onChange={}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="twitter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Twitter</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <X className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    className="pl-10"
                                                    {...field}
                                                    disabled={isPending}
                                                    value={field.value || ''}
                                                // onChange={}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="facebook"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Facebook</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    className="pl-10"
                                                    {...field}
                                                    disabled={isPending}
                                                    value={field.value || ''}
                                                // onChange={}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="youtube"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Youtube</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Youtube className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    className="pl-10"
                                                    {...field}
                                                    disabled={isPending}
                                                    value={field.value || ''}
                                                // onChange={}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {item && (
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div>
                                    <FormLabel className="text-base">Business Status</FormLabel>
                                    <FormDescription>Enable or disable this business </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value ?? false}
                                        onCheckedChange={field.onChange}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex items-center space-x-4 mt-4 border-t-1 border-t-gray-200 pt-5">
                    <CancelButton />
                    <Separator orientation="vertical" />
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="h-11">
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2Icon className="h-4 w-4 animate-spin" />
                                Processing
                            </div>
                        ) : (
                            item ? 'Update business' : submitButtonText
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default BusinessForm;
