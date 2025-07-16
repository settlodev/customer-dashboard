"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { EmailVerificationSchema, RegisterSchema } from "@/types/data-schemas";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { BusinessTimeType } from "@/types/types";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { register, resendVerificationEmail } from "@/lib/actions/auth-actions";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  ArrowRight,
  Building2,
  MapPin,
  User,
  Mail,
} from "lucide-react";
import _ from "lodash";
import { BusinessSchema } from "@/types/business/schema";
import { createBusiness } from "@/lib/actions/auth/business";
import { useToast } from "@/hooks/use-toast";
import BusinessTypeSelector from "@/components/widgets/business-type-selector";
import { Textarea } from "@/components/ui/textarea";
import { LocationSchema } from "@/types/location/schema";
import { createBusinessLocation } from "@/lib/actions/auth/location";
import { PhoneInput } from "../ui/phone-input";
import { businessTimes } from "@/types/constants";
import { useSession } from "next-auth/react";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import GenderSelector from "../widgets/gender-selector";
import CountrySelector from "@/components/widgets/country-selector";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
const defaultCountry = process.env.DEFAULT_COUNTRY;

interface SignUpStepItemType {
  id: string;
  label: string;
  title: string;
  icon: React.ReactNode;
}

const signUpSteps = [
  {
    id: "step1",
    label: "01",
    title: "Personal Info",
    icon: <User className="w-4 h-4" />,
  },
  {
    id: "step2",
    label: "02",
    title: "Email Verification",
    icon: <Mail className="w-4 h-4" />,
  },
  {
    id: "step3",
    label: "03",
    title: "Business Info",
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    id: "step4",
    label: "04",
    title: "Location Info",
    icon: <MapPin className="w-4 h-4" />,
  },
];

function RegisterForm({ step }: { step: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [, setIsRegistrationComplete] = useState<boolean>(false);
  const [stepsDone, setStepsDone] = useState<SignUpStepItemType[]>(() => {
    const currentStepIndex = signUpSteps.findIndex((s) => s.id === step);
    if (currentStepIndex <= 0) return [];
    return signUpSteps.slice(0, currentStepIndex);
  });
  const [currentStep, setCurrentStep] = useState<SignUpStepItemType>(() => {
    return signUpSteps.find((s) => s.id === step) || signUpSteps[0];
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailVerified] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [locationImageUrl, setLocationImageUrl] = useState<string>("");
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();
  const subscription = searchParams.get("package");
  const referredByCode = searchParams.get("referredByCode");
  const { toast } = useToast();

  useEffect(() => {
    if (subscription) {
      localStorage.removeItem("subscription");
      localStorage.setItem("subscription", subscription);
    }
  }, [subscription]);

  // useEffect(() => {
  //   async function getBusiness() {
  //     const myBusiness = await getCurrentBusiness();
  //     setCurrentBusiness(myBusiness);
  //   }
  //
  //   getBusiness();
  // }, []);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      referredByCode: referredByCode,
      country: defaultCountry,
    },
  });

  const emailVerificationForm = useForm<
    z.infer<typeof EmailVerificationSchema>
  >({
    resolver: zodResolver(EmailVerificationSchema),
    defaultValues: {
      email: session.data?.user?.email,
      name: session.data?.user?.name,
    },
  });

  const businessForm = useForm<z.infer<typeof BusinessSchema>>({
    resolver: zodResolver(BusinessSchema),
    defaultValues: {
      email: session?.data?.user.email,
    },
  });

  const storedSubscription =
    typeof window !== "undefined" ? localStorage.getItem("subscription") : null;

  const locationForm = useForm<z.infer<typeof LocationSchema>>({
    resolver: zodResolver(LocationSchema),
    defaultValues: {
      email: session?.data?.user.email,
      //name: currentBusiness?.name,
      phone: session?.data?.user.phoneNumber,
      openingTime: "08:00",
      closingTime: "18:00",
      subscription: storedSubscription,
    },
  });

  // useEffect(() => {
  //   if (session?.data?.user.phoneNumber) {
  //     locationForm.setValue("phone", session.data.user.phoneNumber);
  //   }
  // }, [session?.data?.user.phoneNumber]);

  const onInvalid = useCallback(
    (errors: FieldErrors) => {
      console.log(errors);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:
          typeof errors.message === "string"
            ? errors.message
            : "There was an issue submitting your form, please try later",
      });
    },
    [toast],
  );

  // useEffect(() => {
  //   const getBusiness = async () => {
  //     const myBusiness = await getCurrentBusiness();
  //     setCurrentBusiness(myBusiness);
  //   };
  //   getBusiness();
  // }, []);

  const setMyCurrentStep = useCallback(() => {
    const currentStepIndex = signUpSteps.findIndex(
      (s) => s.id === currentStep.id,
    );
    if (currentStepIndex < signUpSteps.length - 1) {
      setCurrentStep(signUpSteps[currentStepIndex + 1]);
    }
  }, [currentStep.id]);

  const submitData = async (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const data = await register(values);

        if (data.responseType === "error") {
          setError(data.message);
          // Don't clear the error or redirect on error
          return;
        }

        if (data.responseType === "success") {
          //          setSuccess(data.message);
          setIsRegistrationComplete(true);

          setMyCurrentStep();
          // Only redirect on success
          // setTimeout(() => {
          //   window.location.href = "/login";
          // }, 3000);
        }
      } catch (error: any) {
        console.error("Registration exception:", error);
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        setIsRegistrationComplete(false);
      }
    });
  };

  const submitBusinessData = useCallback(
    async (values: z.infer<typeof BusinessSchema>) => {
      if (imageUrl) {
        values.image = imageUrl;
      }

      setError("");
      setSuccess("");

      startTransition(async () => {
        try {
          const data = await createBusiness(values);

          console.log("data from create business", data);

          if (data && data.responseType === "success") {
            setStepsDone((prev) => [...prev, currentStep]);
            setMyCurrentStep();
            // Update URL to reflect the new step
            router.push("/business-location");
          } else if (data && data.responseType === "error") {
            setError(data.message);
            // Don't proceed or reload on error
            return;
          } else {
            setError("An unexpected error occurred. Please try again.");
          }
        } catch (error: any) {
          const errorMessage =
            error?.message || "An unexpected error occurred. Please try again.";
          setError(errorMessage);
        }
      });
    },
    [imageUrl, currentStep, setMyCurrentStep, router],
  );

  const submitLocationData = useCallback(
    async (values: z.infer<typeof LocationSchema>) => {
      try {
        startTransition(async () => {
          const formData = locationImageUrl
            ? { ...values, image: locationImageUrl }
            : values;

          const response = await createBusinessLocation(formData);

          if (!response) {
            setError(
              "Something went wrong while processing your request, please try again",
            );
          }

          if (response.responseType === "error") {
            setError(response.message);
          } else if (response.responseType === "success") {
            router.push("/dashboard");
          }
        });
      } catch (error: any) {
        const errorMessage = error.message || "An unexpected error occurred";
        setError(errorMessage);
      }
    },
    [locationImageUrl, router],
  );

  const submitEmailVerificationData = useCallback(
    async (values: z.infer<typeof EmailVerificationSchema>) => {
      setError("");
      setEmailSent(false);

      startTransition(async () => {
        try {
          const resp = await resendVerificationEmail(values.name, values.email);

          if (resp.responseType === "error") {
            console.error("Email verification error:", resp.message);
            setError(resp.message);
            setEmailSent(false);
            // Don't automatically redirect on error
            // Let the user read the error and decide what to do
          } else {
            setEmailSent(true);
          }
        } catch (error: any) {
          console.error("Email verification exception:", error);
          setError("Failed to send verification email. Please try again.");
          setEmailSent(false);
        }
      });
    },
    [router],
  );

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Progress Bar */}
      <div className="w-full max-w-4xl mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gray-200/50 rounded-full h-1 top-[20px]"></div>
          <div
            className="absolute bg-gradient-to-r from-emerald-500 to-emerald-600 h-1 rounded-full top-[20px] transition-all duration-500"
            style={{
              width: `${((stepsDone.length + 1) / signUpSteps.length) * 100}%`,
            }}
          ></div>
          <div className="relative flex justify-between">
            {signUpSteps.map((item, index) => {
              const isCurrent = currentStep.id === item.id;
              const isDone = _.includes(stepsDone, item);
              return (
                <motion.div
                  key={item.id}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${
                        isDone
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30"
                          : isCurrent
                            ? "bg-white border-2 border-emerald-500 shadow-md"
                            : "bg-white border-2 border-gray-300"
                      }
                  `}
                  >
                    {isDone ? (
                      <CheckIcon size={20} className="text-white" />
                    ) : (
                      <span
                        className={`${isCurrent ? "text-emerald-600" : "text-gray-400"}`}
                      >
                        {item.icon}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium transition-colors ${isCurrent ? "text-gray-900" : "text-gray-500"} `}
                  >
                    {item.title}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl"
      >
        {currentStep.id === "step1" ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Personal Information
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Let&#39;s start with your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormError message={error} />
              <FormSuccess message={success} />
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(submitData)}
                  className="space-y-6"
                >
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="grid lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              First Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                disabled={isPending}
                                placeholder="Enter your first name"
                                className="border-gray-200 focus:border-emerald-500 transition-colors"
                                {...field}
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
                            <FormLabel className="text-gray-700">
                              Last Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                disabled={isPending}
                                placeholder="Enter your last name"
                                className="border-gray-200 focus:border-emerald-500 transition-colors"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Nationality *
                            </FormLabel>
                            <FormControl>
                              <CountrySelector
                                {...field}
                                isDisabled={isPending}
                                placeholder="Select your nationality"
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
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-gray-700 mt-2">
                              Phone Number *
                            </FormLabel>
                            <FormControl>
                              <PhoneInput
                                placeholder="Enter phone number"
                                {...field}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { ref: _ref, ...customSelectRef } = field;
                          return (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Gender *
                              </FormLabel>
                              <FormControl>
                                <GenderSelector
                                  {...customSelectRef}
                                  isRequired
                                  isDisabled={isPending}
                                  label="Gender"
                                  placeholder="Select your gender"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="referredByCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Referral Code
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                value={field.value || ""}
                                placeholder="Enter referral code (optional)"
                                className="border-gray-200 focus:border-emerald-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Email address *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your email address"
                                {...field}
                                type="email"
                                disabled={isPending}
                                className="border-gray-200 focus:border-emerald-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Password *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  disabled={isPending}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a strong password"
                                  className="border-gray-200 focus:border-emerald-500 transition-colors pr-10"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {showPassword ? (
                                    <EyeOffIcon size={18} />
                                  ) : (
                                    <EyeIcon size={18} />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={isPending || emailVerified}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
                    >
                      {isPending ? (
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                          Continue to Email Verification
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : currentStep.id === "step2" || step === "step2" ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Mail className="w-5 h-5 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Verify Your Email
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormError
                message={
                  error
                    ? `${error}. Please log in to resend the email for verification.`
                    : ""
                }
              />
              <FormSuccess message={success} />

              <Form {...emailVerificationForm}>
                <form
                  onSubmit={emailVerificationForm.handleSubmit(
                    submitEmailVerificationData,
                  )}
                >
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-full mt-1">
                        <Mail className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-700 font-medium">
                          We&#39;ve sent an activation link to your email
                          address.
                        </p>
                        <p className="text-gray-600 text-sm">
                          Please check your email and click the link to verify
                          your account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-amber-800">
                      <strong>Haven&#39;t received the email?</strong> Check
                      your spam/junk folder, or click the button below to resend
                      it.
                    </p>
                  </div>

                  {emailSent ? (
                    <div className="mt-6">
                      <FormSuccess message="Verification email sent successfully! Please check your inbox and spam folder." />
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                      ) : (
                        "Resend Verification Email"
                      )}
                    </Button>
                  )}

                  <div className="hidden">
                    <FormField
                      control={emailVerificationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailVerificationForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : currentStep.id === "step3" || step === "step3" ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Business Information
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Tell us about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormError message={error} />
              <FormSuccess message={success} />
              <Form {...businessForm}>
                <form
                  className="space-y-6"
                  onSubmit={businessForm.handleSubmit(
                    submitBusinessData,
                    onInvalid,
                  )}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-1/3">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-xl border border-emerald-200">
                        <UploadImageWidget
                          imagePath={"business"}
                          displayStyle={"default"}
                          displayImage={true}
                          setImage={setImageUrl}
                          label={"Upload Business Logo"}
                        />
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <FormField
                        control={businessForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Business Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your business name"
                                {...field}
                                disabled={isPending}
                                className="border-gray-200 focus:border-emerald-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <FormField
                          control={businessForm.control}
                          name="businessType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Business Type
                              </FormLabel>
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
                          control={businessForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Country
                              </FormLabel>
                              <FormControl>
                                <CountrySelector
                                  {...field}
                                  isDisabled={isPending}
                                  placeholder="Select country"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={businessForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Business Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your business..."
                            {...field}
                            disabled={isPending}
                            className="min-h-[120px] resize-none border-gray-200 focus:border-emerald-500 transition-colors bg-gray-50/50"
                            maxLength={200}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          {field.value?.length || 0}/200 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
                    >
                      {isPending ? (
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                          Continue to Location Setup
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : currentStep.id === "step4" || step === "step4" ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Location Setup
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Configure your business location details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormError message={error} />
              <FormSuccess message={success} />
              <Form {...locationForm}>
                <form
                  onSubmit={locationForm.handleSubmit(
                    submitLocationData,
                    onInvalid,
                  )}
                  className="space-y-8"
                >
                  {/* Location Information Section */}
                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="lg:w-1/3">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-xl border border-emerald-200">
                          <UploadImageWidget
                            imagePath={"location"}
                            displayStyle={"default"}
                            displayImage={true}
                            setImage={setLocationImageUrl}
                            label={"Upload Location Image"}
                          />
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <FormField
                          control={locationForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Location Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Main Branch, Downtown Office, etc."
                                  {...field}
                                  disabled={isPending}
                                  className="border-gray-200 focus:border-emerald-500 transition-colors"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid lg:grid-cols-2 gap-4">
                          <FormField
                            control={locationForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem className="flex flex-col pt-2">
                                <FormLabel className="text-gray-700">
                                  Phone Number
                                </FormLabel>
                                <FormControl>
                                  <PhoneInput
                                    placeholder="Enter phone number"
                                    {...field}
                                    disabled={isPending}
                                    value={field.value || ""}
                                    onChange={(value) => field.onChange(value)}
                                    className="border-gray-200 focus:border-emerald-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={locationForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">
                                  Email
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    disabled={isPending}
                                    type="email"
                                    value={field.value || ""}
                                    placeholder="location@example.com"
                                    className="border-gray-200 focus:border-emerald-500 transition-colors"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Address Section */}
                  <div className="space-y-4">
                    <div className="grid lg:grid-cols-2 gap-4">
                      <FormField
                        control={locationForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              City / Region
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="Enter city name"
                                className="border-gray-200 focus:border-emerald-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={locationForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Full address
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="Enter address"
                                className="border-gray-200 focus:border-emerald-500 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={locationForm.control}
                        name="openingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Opening Time
                            </FormLabel>
                            <FormControl>
                              <Select
                                disabled={isPending}
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="border-gray-200 focus:border-emerald-500 transition-colors">
                                  <SelectValue placeholder="Select opening time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {businessTimes.map(
                                    (item: BusinessTimeType, index: number) => (
                                      <SelectItem key={index} value={item.name}>
                                        {item.label}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={locationForm.control}
                        name="closingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Closing Time
                            </FormLabel>
                            <FormControl>
                              <Select
                                disabled={isPending}
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="border-gray-200 focus:border-emerald-500 transition-colors">
                                  <SelectValue placeholder="Select closing time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {businessTimes.map(
                                    (item: BusinessTimeType, index: number) => (
                                      <SelectItem key={index} value={item.name}>
                                        {item.label}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
                    >
                      {isPending ? (
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                          Complete Registration
                          <CheckIcon className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Registration Complete!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default RegisterForm;
