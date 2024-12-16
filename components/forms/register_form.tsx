"use client"

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

import { BusinessTimeType, FormResponse } from "@/types/types";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { register, resendVerificationEmail } from "@/lib/actions/auth-actions";
import {
    CheckIcon,
    EyeIcon,
    EyeOffIcon,
    Loader2Icon,
    ChevronRight,
    ChevronDownIcon,
} from "lucide-react";
import _ from "lodash";
import { BusinessSchema } from "@/types/business/schema";
import { createBusiness } from "@/lib/actions/auth/business";
import { useToast } from "@/hooks/use-toast";
import { Business } from "@/types/business/type";
import BusinessTypeSelector from "@/components/widgets/business-type-selector";
import { Textarea } from "@/components/ui/textarea";
import { LocationSchema } from "@/types/location/schema";
import { createBusinessLocation } from "@/lib/actions/auth/location";
import { PhoneInput } from "../ui/phone-input";
import { businessTimes } from "@/types/constants";
import { useSession } from "next-auth/react";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import GenderSelector from "../widgets/gender-selector";
import CountrySelector from "@/components/widgets/country-selector";

interface SignUpStepItemType {
    id: string;
    label: string;
    title: string;
}

const signUpSteps = [
    {
        id: "step1",
        label: "01",
        title: "Personal Info",
    },
    {
        id: "step2",
        label: "02",
        title: "Verification",
    },
    {
        id: "step3",
        label: "03",
        title: "Business Info",
    },
    {
        id: "step4",
        label: "04",
        title: "Location Info",
    }
];

function RegisterForm({ step }: { step: string }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [success] = useState<string | undefined>("");
    const [stepsDone, setStepsDone] = useState<SignUpStepItemType[]>(() => {
        const currentStepIndex = signUpSteps.findIndex(s => s.id === step);
        if (currentStepIndex <= 0) return [];
        return signUpSteps.slice(0, currentStepIndex);
    });
    const [currentStep, setCurrentStep] = useState<SignUpStepItemType>(() => {
        return signUpSteps.find(s => s.id === step) || signUpSteps[0];
    });
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [currentBusiness, setCurrentBusiness] = useState<Business | undefined>(undefined);
    const [emailVerified] = useState<boolean>(false);
    const [emailSent, setEmailSent] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [locationImageUrl, setLocationImageUrl] = useState<string>("");

    useEffect(() => {
        async function getBusiness() {
            const myBusiness = await getCurrentBusiness();
            setCurrentBusiness(myBusiness);
        }

        getBusiness();
    }, []);

    const session = useSession();

    /*TODO: Business form information*/
    const { toast } = useToast();

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: { },
    });

    const emailVerificationForm = useForm<z.infer<typeof EmailVerificationSchema>>({
        resolver: zodResolver(EmailVerificationSchema),
        defaultValues: { email: session.data?.user?.email, name: session.data?.user?.name },
    });

    const businessForm = useForm<z.infer<typeof BusinessSchema>>({
        resolver: zodResolver(BusinessSchema),
        defaultValues: {
            email: session?.data?.user.email
        }
    });

    const locationForm = useForm<z.infer<typeof LocationSchema>>({
        resolver: zodResolver(LocationSchema),
        defaultValues: {
            phone: session?.data?.user.phoneNumber,
            email: session?.data?.user.email,
            name: currentBusiness?.name,
            openingTime: "07:00",
            closingTime: "23:00",
        },
    });

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description:
                    typeof errors.message === 'string'
                        ? errors.message
                        : "There was an issue submitting your form, please try later",
            });
        },
        [toast]
    );

    useEffect(() => {
        const getBusiness = async () => {
            const myBusiness = await getCurrentBusiness();
            setCurrentBusiness(myBusiness);
        };
        getBusiness();
    }, []);

    const setMyCurrentStep = useCallback(() => {
        const currentStepIndex = signUpSteps.findIndex(s => s.id === currentStep.id);
        if (currentStepIndex < signUpSteps.length - 1) {
            setCurrentStep(signUpSteps[currentStepIndex + 1]);
        }
    }, [currentStep.id]);

    const submitData = async (values: z.infer<typeof RegisterSchema>) => {
        startTransition(() => {
            register(values)
                .then((data: FormResponse) => {
                    if (!data) {
                        setError("An unexpected error occurred. Please try again.");
                        return;
                    }
                    if (data.responseType === "error") {
                        setError(data.message);
                    } else {
                        //window.location.reload();
                    }
                })
                .catch((error) => {
                    setError(error.data?.message);
                    console.error(error);
                });
        });
    }

    const submitBusinessData = useCallback((values: z.infer<typeof BusinessSchema>) => {
        if (imageUrl) {
            values.image = imageUrl;
        }
        startTransition(() => {
            createBusiness(values)
                .then(async (data) => {
                    if (data && "id" in data) {
                        setStepsDone(prev => [...prev, currentStep]);
                        setMyCurrentStep();
                        window.location.reload();
                    } else if (data && data.responseType === "error") {
                        setError(data.message);
                    } else {
                        setError("An unexpected error occurred. Please try again.");
                    }
                })
                .catch((error) => {
                    setError(
                        "An unexpected error occurred. Please try again." +
                        (error instanceof Error ? " " + error.message : "")
                    );
                });
        });
    }, [imageUrl, currentStep, setMyCurrentStep]);

    const submitLocationData = useCallback(
        (values: z.infer<typeof LocationSchema>) => {
            if (locationImageUrl) {
                values.image = locationImageUrl;
            }
            startTransition(() => {
                createBusinessLocation(values).then((data) => {
                    if (data) {
                        if (data.responseType === "success") {
                            window.location.href = "/dashboard";
                        } else if (data.responseType === "error") {
                            toast({
                                variant: "destructive",
                                title: "Uh oh! Something went wrong.",
                                description: data.message,
                            });
                        }
                    }
                });
            });
        },
        []
    );

    const submitEmailVerificationData = useCallback(
        (values: z.infer<typeof EmailVerificationSchema>) => {
            startTransition(() => {
                resendVerificationEmail(values.name, values.email).then((resp) => {
                    if (resp.responseType === 'error') {
                        toast({
                            variant: "destructive",
                            title: "Uh oh! Something went wrong.",
                            description: resp.message
                        });
                    } else {
                        setEmailSent(true);
                    }
                });
            });
        },
        [toast]
    );

    return (
        <div className=" flex flex-col items-center justify-center w-full lg:pl-16 md:pl-16 lg:pr-20 md:pr-16">
            <div className="flex items-center justify-center gap-4 w-full">
                {signUpSteps.map((item, index) => {
                    const isCurrent = currentStep.id === item.id || _.includes(stepsDone, item);
                    return (
                        <div key={item.id} className="flex flex-col items-center justify-center relative mt-10 w-full">
                            <div className="flex items-center justify-center">
                                <span
                                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${_.includes(stepsDone, item) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-400'}`}>
                                    {_.includes(stepsDone, item) ? (
                                        <CheckIcon size={16} className="text-gray-50" />
                                    ) : (
                                        <span className={`font-bold text-center ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>{index + 1}</span>
                                    )}
                                </span>
                            </div>

                            {index + 1 < signUpSteps.length && (
                                <div className="absolute top-[50%] left-[70%] lg:left-[55%] md:left-[56%] w-full h-[2px] bg-gray-400 transform -translate-y-1/2"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {currentStep.id === "step1" ?
                <Card className="w-full sm:w-auto mt-6 lg:mr-10 pl-6 pr-6 pt-2 pb-5">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Enter your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormError message={error} />
                        <FormSuccess message={success} />
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(submitData)}>
                                <div className="pl-0 pr-3 pt-2 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                    <h3 className="font-bold flex-1">Basic Information</h3>
                                    <span className="flex-end">
                                        <ChevronDownIcon />
                                    </span>
                                </div>
                                <div className="grid gap-4">
                                    <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>First Name</FormLabel>
                                                        <FormControl>
                                                            <Input disabled={isPending} placeholder="Enter first name" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name="lastName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Last Name</FormLabel>
                                                        <FormControl>
                                                            <Input disabled={isPending} placeholder="Enter last name" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">

                                        <FormField
                                            control={form.control}
                                            name="country"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nationality</FormLabel>
                                                    <FormControl>
                                                        <CountrySelector
                                                            {...field}
                                                            isRequired
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
                                                <FormItem className="flex flex-col mt-1">
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl className="w-full border-1 rounded-sm">
                                                        <PhoneInput
                                                            placeholder="Enter phone number"
                                                            {...field} disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormDescription></FormDescription>
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
                                                        <FormLabel>Gender</FormLabel>
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

                                    </div>

                                    <div
                                        className="pl-0 pr-3 pt-2 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                        <h3 className="font-bold flex-1">Login Information</h3>
                                        <span className="flex-end"><ChevronDownIcon /></span>
                                    </div>

                                    <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter valid email"
                                                            {...field}
                                                            type="email"
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>{/* Enter user name */}</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input disabled={isPending} type={showPassword ? "text" : "password"}
                                                                placeholder="Enter password" {...field} />
                                                            <span onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-0 top-0 h-full w-10 flex items-center justify-center z-40 cursor-pointer">
                                                                {showPassword ? <EyeOffIcon size={20} /> :
                                                                    <EyeIcon size={20} />}</span>
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>{/* Enter user name */}</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="">
                                    <div className="w-full sm:w-auto">
                                        <Button
                                            type="submit"
                                            disabled={isPending || emailVerified}
                                            className="w-full sm:w-auto mt-4 p-7 hover:bg-emerald-500">
                                            {(isPending) ?
                                                <Loader2Icon className="w-6 h-6 animate-spin" /> :
                                                <>Next: Business info <ChevronRight /></>
                                            }
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                : (currentStep.id === "step2" || step === "step2") ? <>
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <Form {...emailVerificationForm}>
                        <form onSubmit={emailVerificationForm.handleSubmit(submitEmailVerificationData)}>
                            <Card className="w-full sm:w-auto mt-6">
                                <CardHeader>
                                    <CardTitle>Verify email</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="font-normal">
                                        We have sent a link with activation instruction to your email address.
                                        Please check your email and click on the link to verify your email address.
                                    </CardDescription>
                                    {emailSent ?
                                        <CardDescription className="text-green-500 py-4 flex">
                                            <FormSuccess message="Email sent successfully" />
                                        </CardDescription>
                                        : <Button type="submit" className="mt-4" disabled={isPending}>
                                            {isPending ?
                                                <Loader2Icon className="w-6 h-6 animate-spin" /> :
                                                "Resend verification email"
                                            }
                                        </Button>}

                                </CardContent>
                            </Card>
                            <div className="hidden">

                                <FormField
                                    control={emailVerificationForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isPending}
                                                />
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
                                                <Input
                                                    {...field}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                            </div>
                        </form>
                    </Form>
                </>
                    : (currentStep.id === "step3" || step === "step3") ? <>
                        <Card className="w-full  mt-6 lg:mr-10 md:mr-10  pl-6 pr-6 pt-2 pb-5">
                            <CardHeader>
                                <CardTitle>Business Information</CardTitle>
                                <CardDescription>Enter details for your business</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormError message={error} />
                                <FormSuccess message={success} />
                                <Form {...businessForm}>
                                    <form
                                        className="space-y-8"
                                        onSubmit={businessForm.handleSubmit(submitBusinessData, onInvalid)}
                                    >

                                        <div className="mt-4 flex">

                                            <UploadImageWidget imagePath={'business'} displayStyle={'default'} displayImage={true} setImage={setImageUrl} />

                                            <div className="flex-1">
                                                <FormField
                                                    control={businessForm.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Business Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter business name"
                                                                    {...field}
                                                                    disabled={isPending}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid lg:grid-cols-2 md:grid-cols-2 grid-rows-1 gap-4">

                                            <FormField
                                                control={businessForm.control}
                                                name="businessType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Type of business</FormLabel>
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
                                                        <FormLabel>Country of registration</FormLabel>
                                                        <FormControl>
                                                            <CountrySelector
                                                                {...field}
                                                                isDisabled={isPending}
                                                                placeholder="Select country of registration"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 grid-rows-1 gap-4">
                                            <FormField
                                                control={businessForm.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Business Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter business description"
                                                                {...field}
                                                                disabled={isPending}
                                                                className="resize-none bg-gray-50"
                                                                maxLength={200}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="">
                                            <div className="w-full sm:w-auto ">

                                                <Button
                                                    type="submit"
                                                    disabled={isPending}
                                                    className={`w-full sm:w-auto mt-3 p-6`}>
                                                    {isPending ?
                                                        <Loader2Icon className="w-6 h-6 animate-spin" /> :
                                                        <> Next: Location info <ChevronRight /></>
                                                    }
                                                </Button>
                                            </div>
                                        </div>

                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </>
                        : (currentStep.id === "step4" || step === "step4") ? <>
                            <Card className="w-full mt-6 lg:mr-10 md:mr-10 pl-6 pr-6 pt-2 pb-5">
                                <CardHeader>
                                    <CardTitle>Setup location</CardTitle>
                                    <CardDescription>
                                        Setup your business location details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>

                                    <Form {...locationForm}>
                                        <form onSubmit={locationForm.handleSubmit(submitLocationData, onInvalid)}>

                                            <div
                                                className="pl-0 pr-3 pt-2 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                                <h3 className="font-bold flex-1">Location Information</h3>
                                                <span className="flex-end"><ChevronDownIcon /></span>
                                            </div>
                                            <div className="mt-4 flex">
                                                <UploadImageWidget imagePath={'business'} displayStyle={'default'} displayImage={true} setImage={setLocationImageUrl} />
                                                <div className="flex-1">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Location Name</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter location name"
                                                                        {...field}
                                                                        disabled={isPending}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="lg:grid lg:grid-cols-2 md:grid-cols-2 gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="phone"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col mt-1">
                                                                <FormLabel>Phone Number</FormLabel>
                                                                <FormControl className="w-full border-1 rounded-sm">
                                                                    <PhoneInput
                                                                        placeholder="Enter phone number"
                                                                        {...field} disabled={isPending}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Email</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        type="email"
                                                                        value={field.value || ""}
                                                                        placeholder="Enter location email address"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className="pl-0 pr-3 pt-8 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                                <h3 className="font-bold flex-1">Business address</h3>
                                                <span className="flex-end"><ChevronDownIcon /></span>
                                            </div>
                                            <div className="lg:grid grid-cols-2  gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="city"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>City / Region</FormLabel>
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
                                                </div>

                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="address"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Full business address</FormLabel>
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
                                                </div>
                                            </div>

                                            <div
                                                className="pl-0 pr-3 pt-8 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                                <h3 className="font-bold flex-1">Operating times</h3>
                                                <span className="flex-end"><ChevronDownIcon /></span>
                                            </div>
                                            <div className="lg:grid grid-cols-2 gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="openingTime"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Opening Time</FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        disabled={isPending }
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue
                                                                                placeholder="Select opening time" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {businessTimes.length > 0
                                                                                ? businessTimes.map((item: BusinessTimeType, index: number) => (
                                                                                    <SelectItem key={index}
                                                                                        value={item.name}>
                                                                                        {item.label}
                                                                                    </SelectItem>
                                                                                ))
                                                                                : <></>}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-2">

                                                    <FormField
                                                        control={locationForm.control}
                                                        name="closingTime"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Closing Time</FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        disabled={isPending}
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue
                                                                                placeholder="Select closing time" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {businessTimes.length > 0
                                                                                ? businessTimes.map((item: BusinessTimeType, index: number) => (
                                                                                    <SelectItem key={index}
                                                                                        value={item.name}>
                                                                                        {item.label}
                                                                                    </SelectItem>
                                                                                ))
                                                                                : <></>}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>


                                            <div className="">
                                                <div className="w-full sm:w-auto">

                                                    <Button
                                                        type="submit"
                                                        disabled={isPending}
                                                        className={`w-full sm:w-auto mt-3 p-7`}>
                                                        {isPending ?
                                                            <Loader2Icon className="w-6 h-6 animate-spin" /> :
                                                            <span className=" flex font-semibold text-[16px]"> Complete <ChevronRight /></span>
                                                        }
                                                    </Button>
                                                </div>
                                            </div>

                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </>
                    : <p>End</p>
            }

        </div>
    );
}

export default RegisterForm;
