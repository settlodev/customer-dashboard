"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import React, { useCallback, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { FormResponse } from "@/types/types";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/widgets/form-error";
import { FormSuccess } from "@/components/widgets/form-success";
import CancelButton from "@/components/widgets/cancel-button";
import SubmitButton from "@/components/widgets/submit-button";
import { EmploymentDetailsSchema } from "@/types/tanqr/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function RequestTanqrForm() {
  const [isPending, startTransition] = useTransition();
  const [, setResponse] = useState<FormResponse | undefined>();
  const [error] = useState<string | undefined>("");
  const [success] = useState<string | undefined>("");
  const [nidaVerified, setNidaVerified] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof EmploymentDetailsSchema>>({
    resolver: zodResolver(EmploymentDetailsSchema),
    defaultValues: {
      employed: false,
    },
  });

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log(errors);
      toast({
        variant: "destructive",
        title: "Uh oh! something went wrong",
        description:
          typeof errors.message === "string" && errors.message
            ? errors.message
            : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof EmploymentDetailsSchema>) => {
    startTransition(() => {
      // Your submission logic here
      console.log(values);
    });
  };

  const verifyNida = () => {
    const nidaValue = form.getValues("nida");
    if (nidaValue) {
      // Add your NIDA verification logic here
      setNidaVerified(true);
      toast({
        title: "NIDA Verified",
        description: "Your NIDA has been verified successfully.",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitData, onInvalid)}
        className="space-y-6"
      >
        <FormError message={error} />
        <FormSuccess message={success} />

        {/* NIDA Verification Section */}
        <Card>
          <CardHeader>
            <CardTitle>NIDA Verification</CardTitle>
            <CardDescription>
              Please enter your NIDA number to begin the KYC process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <FormField
                control={form.control}
                name="nida"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>NIDA Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter NIDA number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        disabled={isPending || nidaVerified}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                onClick={verifyNida}
                disabled={nidaVerified || isPending}
              >
                {nidaVerified ? "Verified" : "Verify"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {nidaVerified && (
          <>
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Provide your basic personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter contact number"
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
                  name="marriageFlag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="S (Single) or M (Married)"
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
                  name="spouseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spouse Name (if applicable)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter spouse name"
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
                  name="religionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter religion ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="countryOfBirthId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Birth ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter country of birth ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter address"
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
                  name="addressCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter city"
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
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter postal code"
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
                  name="addressFromDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address From Date</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DD/MM/YYYY"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Identification Information */}
            <Card>
              <CardHeader>
                <CardTitle>Identification Information</CardTitle>
                <CardDescription>
                  Your identification document details
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="idIssueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Issue Date</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DD/MM/YYYY"
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
                  name="idExpiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Expiry Date</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DD/MM/YYYY"
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
                  name="idCityOfIssue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City of Issue</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter city of issue"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
                <CardDescription>
                  Details about your employment status
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 md:col-span-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Currently Employed</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employmentCategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Category ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter category ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employmentStartYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Start Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="YYYY"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter employer name"
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
                  name="occupationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter occupation ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employAddressLine"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Employment Address Line</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter employment address"
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
                  name="employmentCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter employment city"
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
                  name="employmentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter full employment address"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Qualification Information */}
            <Card>
              <CardHeader>
                <CardTitle>Qualification Information</CardTitle>
                <CardDescription>
                  Your educational and professional qualifications
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="qualificationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter qualification ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qualificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter qualification code"
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
                  name="professionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profession ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter profession ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="professionCd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profession Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter profession code"
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
                  name="profQualificationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Qualification ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter professional qualification ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profQualificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Qualification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter professional qualification code"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>
                  Your financial and income details
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="grossAnnualSalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gross Annual Salary ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter gross annual salary ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceOfFundId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source of Fund ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter source of fund ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceOfFundCd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source of Fund Code</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter source of fund code"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountProductId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Product ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter account product ID"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex h-5 items-center space-x-4 pt-4">
              <CancelButton />
              <Separator orientation="vertical" />
              <SubmitButton isPending={isPending} label="Submit KYC" />
            </div>
          </>
        )}
      </form>
    </Form>
  );
}

export default RequestTanqrForm;
