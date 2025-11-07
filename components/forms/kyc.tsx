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
import React, { useCallback, useState, useTransition, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
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
import { MhbDataMap } from "@/components/hooks/mhb-mapper";
import {
  fetchMhbDataMap,
  validateNida,
  submitNidaAnswer,
} from "@/lib/actions/mhb";
import { MhbSelect } from "@/components/widgets/mhb-selector";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NidaQuestion } from "@/types/mhb/type";

const getMhbDataList = (
  mhbData: MhbDataMap | null,
  listName: keyof MhbDataMap,
) => {
  if (!mhbData || !mhbData[listName]) return [];
  return mhbData[listName] as any[];
};

function RequestTanqrForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [mhbData, setMhbData] = useState<MhbDataMap | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const { toast } = useToast();

  // NIDA Verification states
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<NidaQuestion | null>(
    null,
  );
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [verifyingNida, setVerifyingNida] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<z.infer<
    typeof EmploymentDetailsSchema
  > | null>(null);

  const form = useForm<z.infer<typeof EmploymentDetailsSchema>>({
    resolver: zodResolver(EmploymentDetailsSchema),
    defaultValues: {
      employed: false,
    },
  });

  useEffect(() => {
    const loadMhbData = async () => {
      setLoadingData(true);
      try {
        const response = await fetchMhbDataMap();
        if (response && response.data) {
          setMhbData(response.data.data);
        } else {
          throw new Error("Invalid data structure received");
        }
      } catch (error) {
        console.error("Failed to load MHB data map:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load form data. Please try again.",
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadMhbData();
  }, [toast]);

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

  // Function to create account after successful NIDA verification
  const createAccount = async (
    formData: z.infer<typeof EmploymentDetailsSchema>,
  ) => {
    try {
      if (!mhbData) {
        throw new Error("Form data not loaded");
      }

      console.log("Creating account with payload:", formData);

      // TODO: Replace with your actual account creation API call
      // const response = await createAccountApi(formData);

      setSuccess("Account created successfully!");
      toast({
        title: "Success",
        description: "Your account has been created successfully!",
      });

      // Reset form or redirect user
      // router.push('/success');
    } catch (error: any) {
      console.error("Account creation error:", error);
      setError("Failed to create account. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error?.message || "Failed to create account. Please try again.",
      });
    }
  };

  // Start NIDA verification process
  const startNidaVerification = async (nidaNumber: string) => {
    setVerifyingNida(true);
    try {
      const verificationResult = await validateNida(nidaNumber);

      if (verificationResult) {
        if (verificationResult.hasMoreQuestions) {
          // Has questions to answer
          setCurrentQuestion(verificationResult);
          setCurrentAnswer("");
          setShowVerificationDialog(true);
          toast({
            title: "Verification Required",
            description: "Please answer the verification questions to proceed.",
          });
        } else {
          // No questions, verification complete
          toast({
            title: "NIDA Verified",
            description: "Your NIDA has been verified successfully.",
          });
          // Proceed to create account
          if (pendingFormData) {
            await createAccount(pendingFormData);
          }
        }
      } else {
        throw new Error("NIDA verification failed");
      }
    } catch (error: any) {
      console.error("NIDA verification error:", error);
      setError(error?.message || "Failed to verify NIDA");
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description:
          error?.message ||
          "Failed to verify NIDA. Please check the number and try again.",
      });
      setPendingFormData(null);
    } finally {
      setVerifyingNida(false);
    }
  };

  // Handle verification question answer submission
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    if (!currentAnswer.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide an answer",
      });
      return;
    }

    setSubmittingAnswer(true);
    try {
      const response = await submitNidaAnswer(
        currentQuestion.identificationNumber,
        currentQuestion.questionCode,
        currentAnswer,
      );

      if (response) {
        if (response.hasMoreQuestions) {
          // More questions to answer
          setCurrentQuestion(response);
          setCurrentAnswer("");
          toast({
            title: "Answer Submitted",
            description: `Question ${response.questionNumber} of verification process.`,
          });
        } else {
          // All questions answered successfully
          setCurrentQuestion(null);
          setCurrentAnswer("");
          setShowVerificationDialog(false);

          toast({
            title: "NIDA Verified Successfully",
            description:
              "All verification questions have been answered correctly.",
          });

          // Proceed to create account
          if (pendingFormData) {
            await createAccount(pendingFormData);
            setPendingFormData(null);
          }
        }
      } else {
        throw new Error("Answer submission failed");
      }
    } catch (error: any) {
      console.error("Answer submission error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          error?.message || "Failed to submit answer. Please try again.",
      });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Handle form submission
  const submitData = (values: z.infer<typeof EmploymentDetailsSchema>) => {
    startTransition(async () => {
      try {
        if (!mhbData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Form data not loaded. Please refresh the page.",
          });
          return;
        }

        // Validate NIDA number exists
        if (!values.nida) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please enter your NIDA number",
          });
          return;
        }

        // Store form data and start NIDA verification
        setPendingFormData(values);
        await startNidaVerification(values.nida);
      } catch (error: any) {
        console.error("Form submission error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error?.message || "Failed to submit form. Please try again.",
        });
      }
    });
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          className="space-y-6"
        >
          <FormError message={error} />
          <FormSuccess message={success} />

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
                name="nida"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>NIDA Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter NIDA number"
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
                      <MhbSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={getMhbDataList(
                          mhbData,
                          "marital_status_list",
                        ).map((ms) => ({
                          id: ms.code,
                          name: ms.name,
                        }))}
                        placeholder="Select marital status"
                        disabled={isPending || !mhbData}
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
                    <FormLabel>Religion</FormLabel>
                    <FormControl>
                      <MhbSelect
                        value={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        options={getMhbDataList(mhbData, "religion_list").map(
                          (r) => ({
                            id: r.religion_id,
                            name: r.religion_desc,
                          }),
                        )}
                        placeholder="Select religion"
                        disabled={isPending || !mhbData}
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
                    <FormLabel>Country of Birth</FormLabel>
                    <FormControl>
                      <MhbSelect
                        value={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        options={getMhbDataList(mhbData, "country_list").map(
                          (c) => ({
                            id: c.cntry_id,
                            name: c.cntry_nm,
                            code: c.cntry_cd,
                          }),
                        )}
                        placeholder="Select country of birth"
                        disabled={isPending || !mhbData}
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
                      <Input type="date" {...field} disabled={isPending} />
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
                    <FormLabel>Employment Category</FormLabel>
                    <FormControl>
                      <MhbSelect
                        value={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        options={getMhbDataList(
                          mhbData,
                          "employment_category_list",
                        ).map((ec) => ({
                          id: ec.id,
                          name: ec.name,
                        }))}
                        placeholder="Select employment category"
                        disabled={isPending || !mhbData}
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
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <MhbSelect
                        value={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        options={getMhbDataList(
                          mhbData,
                          "occupation_category_list",
                        ).map((occ) => ({
                          id: occ.occupation_id,
                          name: occ.occupation_desc,
                        }))}
                        placeholder="Select occupation"
                        disabled={isPending || !mhbData}
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
                    <FormLabel>Gross Annual Salary Range</FormLabel>
                    <FormControl>
                      <MhbSelect
                        value={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        options={getMhbDataList(
                          mhbData,
                          "salary_scale_list",
                        ).map((ss) => ({
                          id: ss.id,
                          name: `${ss.code} - TZS ${ss.from_amt?.toLocaleString()} to ${ss.to_amt?.toLocaleString()}`,
                        }))}
                        placeholder="Select salary range"
                        disabled={isPending || !mhbData}
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
                    <FormLabel>Source of Funds</FormLabel>
                    <FormControl>
                      <MhbSelect
                        value={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        options={getMhbDataList(
                          mhbData,
                          "source_of_fund_list",
                        ).map((sf) => ({
                          id: sf.id,
                          name: sf.name,
                        }))}
                        placeholder="Select source of funds"
                        disabled={isPending || !mhbData}
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
                    <FormLabel>Account Product</FormLabel>
                    <FormControl>
                      <MhbSelect
                        value={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        options={getMhbDataList(
                          mhbData,
                          "account_products",
                        ).map((ap) => ({
                          id: ap.prod_id,
                          name: ap.prod_desc,
                        }))}
                        placeholder="Select account product"
                        disabled={isPending || !mhbData}
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
            <SubmitButton
              isPending={isPending || verifyingNida}
              label={verifyingNida ? "Verifying..." : "Submit"}
            />
          </div>
        </form>
      </Form>

      {/* NIDA Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              NIDA Verification Required
            </DialogTitle>
            <DialogDescription>
              Please answer the following security question to verify your
              identity.
            </DialogDescription>
          </DialogHeader>

          {currentQuestion && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Question {currentQuestion.questionNumber}
                  </span>
                  {currentQuestion.hasMoreQuestions && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      More questions to follow
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-slate-900">
                    {currentQuestion.questionEn}
                  </p>
                  <p className="text-sm text-slate-600 italic">
                    {currentQuestion.questionSw}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Your Answer
                </label>
                <Input
                  type="text"
                  placeholder="Enter your answer"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  disabled={submittingAnswer}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowVerificationDialog(false);
                    setCurrentQuestion(null);
                    setCurrentAnswer("");
                    setPendingFormData(null);
                  }}
                  disabled={submittingAnswer}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={submittingAnswer || !currentAnswer.trim()}
                >
                  {submittingAnswer ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RequestTanqrForm;
