"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useState, useTransition } from "react";
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
// import {Switch} from "@radix-ui/react-switch";
import {Textarea} from "@/components/ui/textarea";
import CancelButton from "@/components/widgets/cancel-button";
import {SubmitButton} from "@/components/widgets/submit-button";
import GenderSelector from "@/components/widgets/gender-selector";
import { useToast } from "@/hooks/use-toast"
import { Department } from "@/types/department/type";
import { fectchAllDepartments } from "@/lib/actions/department-actions";
import { Select, SelectContent, SelectItem, SelectTrigger,SelectValue } from "../ui/select";
import { fectchSalaries } from "@/lib/actions/salary-actions";
import { Salary } from "@/types/salary/type";
import { fetchAllRoles } from "@/lib/actions/role-actions";
import { Role } from "@/types/roles/type";
import { PhoneInput } from "../ui/phone-input";
import { Switch } from "../ui/switch";
import { fetchCountries } from "@/lib/actions/countries-actions";
import { Country } from "@/types/country/type";

const StaffForm = ({ item }: { item: Staff | null | undefined }) => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [, setResponse] = useState<FormResponse | undefined>();
    const [departments,setDepartments ] = useState<Department[]>([]);
    const [salaries,setSalaries ] = useState<Salary[]>([]);
    const [roles,setRoles ] = useState<Role[]>([]);
    const [countries,setCountries ] = useState<Country[]>([]);

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

    useEffect(() => {
        const salaries = async () => {
            try {
                const response = await fectchSalaries();
                setSalaries(response);
            } catch (error) {
                console.error("Error fetching salaries", error);
            }
        }

        salaries();
    }, []);

    useEffect(() => {
        const roles = async () => {
            try {
                const response = await fetchAllRoles();
                setRoles(response);
            } catch (error) {
                console.error("Error fetching roles", error);
            }
        }

        roles();
    }, []);

    useEffect(() => {
        const getCountries = async () => {
            try {
                const response = await fetchCountries();
                setCountries(response);
            } catch (error) {
                console.error("Error fetching countries", error);
            }
        };
        getCountries();

    }, []);


    const defaultCountry = "55b3323c-17fa-4da4-8780-17b9fe830d01";
    const form = useForm<z.infer<typeof StaffSchema>>({
        resolver: zodResolver(StaffSchema),
        defaultValues: {
            ...item,
            nationality: item?.nationality || defaultCountry,
            status: item ? item.status : true,
        },
    });

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            console.log("onInvalid errors are ", errors);
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
                        <>
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter staff full name"
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
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col items-center mt-1">
                                                <FormControl className="w-full border-1 rounded-sm">
                                                    <PhoneInput
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
                                        name="passCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter staff passcode"
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
                                        name="employeeNumber"
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
                                        name="department"
                                        render={({ field }) => {
                                            return (
                                                <FormItem>
                                                    <FormControl>
                                                    <Select
                                                        disabled={isPending || departments.length === 0}
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={departments.length > 0 ? "Select a department": "No departments found"}/>
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
                                            );
                                        }}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="salary"
                                        render={({ field }) => {
                                            return (
                                                <FormItem>
                                                    <FormControl>
                                                    <Select
                                                        disabled={isPending || salaries.length === 0}
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={salaries.length > 0 ? "Select a salary": "No salaries found"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {salaries.length > 0
                                                            ? salaries.map((sal: Salary, index: number) => (
                                                                <SelectItem key={index} value={sal.id}>
                                                                    {sal.amount}{" "}
                                                                </SelectItem>
                                                                ))
                                                            : null}
                                                        </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => {
                                            return (
                                                <FormItem>
                                                    <FormControl>
                                                    <Select
                                                        disabled={isPending || roles.length === 0}
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={roles.length > 0 ? "Select a role": "No roles found"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roles.length > 0
                                                            ? roles.map((rol: Role, index: number) => (
                                                                <SelectItem key={index} value={rol.id}>
                                                                    {rol.name}{" "}
                                                                </SelectItem>
                                                                ))
                                                            : null}
                                                        </SelectContent>
                                                        </Select>
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
                                                        placeholder="Enter staff home address"
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
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Select
                                                            disabled={isPending || countries.length === 0}
                                                            onValueChange={field.onChange}
                                                            value={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select staff nationality" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {countries.length > 0
                                                                    ? countries.map((country: Country, index: number) => (
                                                                        <SelectItem
                                                                            key={index}
                                                                            value={country.id}>
                                                                            {country.name}
                                                                        </SelectItem>
                                                                    ))
                                                                : <></>}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Staff status</FormLabel>
                                                    <FormDescription className="text-sm text-muted-foreground">
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
                                      <FormField
                                        control={form.control}
                                        name="posAccess"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <FormLabel>Allow POS Access</FormLabel>
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
                                          <FormField
                                        control={form.control}
                                        name="dashboardAccess"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <FormLabel>Allow Dashboard Access</FormLabel>
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
                            </>
                        </>
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Person</CardTitle>
                                <CardDescription>
                                    Staff relative contact person, incase of emergency
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-4">
                            <FormField
                                        control={form.control}
                                        name="emergencyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter relative full name"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                       <FormField
                                        control={form.control}
                                        name="emergencyNumber"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col items-center mt-1">
                                                <FormControl className="w-full border-1 rounded-sm">
                                                    <PhoneInput
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter relative phone number"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="emergencyRelationship"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isPending}
                                                        placeholder="Enter relative's relationship"
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
