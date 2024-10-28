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
import React, {useCallback, useEffect, useState, useTransition} from "react";
import {EmailVerificationSchema, RegisterSchema} from "@/types/data-schemas";
import {FieldErrors, useForm} from "react-hook-form";
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

import {BusinessTimeType, FormResponse} from "@/types/types";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { register } from "@/lib/actions/auth-actions";
import {
    CheckIcon,
    EyeIcon,
    EyeOffIcon,
    Loader2Icon,
    ChevronRight,
    ChevronDownIcon,
    ImageIcon
} from "lucide-react";
import { fetchCountries } from "@/lib/actions/countries-actions";
import { Country } from "@/types/country/type";
import _ from "lodash";
import {BusinessSchema} from "@/types/business/schema";
import {createBusiness} from "@/lib/actions/auth/business";
import {useToast} from "@/hooks/use-toast";
import {Business} from "@/types/business/type";
import BusinessTypeSelector from "@/components/widgets/business-type-selector";
import {Textarea} from "@/components/ui/textarea";
import {LocationSchema} from "@/types/location/schema";
import {createBusinessLocation} from "@/lib/actions/auth/location";
import { PhoneInput } from "../ui/phone-input";
import {businessTimes} from "@/types/constants";
import {useSession} from "next-auth/react";
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";
interface signUpStepItemType{
    id: string;
    label: string;
    title: string;
}
const signUpSteps=[
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
]

function RegisterForm({step}:{step: string}) {
    const mCurrentStep = step?signUpSteps[_.findIndex(signUpSteps, {id: step})]:signUpSteps[0];
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [success] = useState<string | undefined>("");
    const [countries, setCountries] = useState([]);
    const [stepsDone, setStepsDone] = useState<signUpStepItemType[]>([]);
    const [currentStep, setCurrentStep] = useState<signUpStepItemType>(mCurrentStep);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [currentBusiness, setCurrentBusiness] = useState<Business | undefined>(undefined);
    const [emailVerified, setEmailVerified] = useState<boolean>(false);

    useEffect(() => {
        async function getBusiness(){
            const myBusiness = await getCurrentBusiness();
            setCurrentBusiness(myBusiness);
        }

        getBusiness();
    }, []);

    const defaultCountry = "55b3323c-17fa-4da4-8780-17b9fe830d01";
    const session = useSession();

    /*TODO: Business form information*/
    const {toast} = useToast();

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {country: defaultCountry},
    });

    const emailVerificationForm = useForm<z.infer<typeof EmailVerificationSchema>>({
        resolver: zodResolver(EmailVerificationSchema),
        defaultValues: {email: session.data?.user?.email},
    });

    const businessForm = useForm<z.infer<typeof BusinessSchema>>({
        resolver: zodResolver(BusinessSchema),
        defaultValues: {
            country: defaultCountry,
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
            //console.log("errors");
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
        const getCountries = async () => {
            try {
                const response = await fetchCountries();
                setCountries(response);
            } catch (error) {
                console.error("Error fetching countries", error);
            }
        };
        getCountries();

        if(step){
            //console.log("step is:", step);
            if(step === "step2"){
                setStepsDone([...stepsDone, signUpSteps[0]])
            }
            if(step === "step3"){
                const doneSteps = [...stepsDone, signUpSteps[0], signUpSteps[1]];
                //console.log("Done steps: ", doneSteps)
                setStepsDone(doneSteps)
            }
        }

    }, []);

    const setMyCurrentStep = () => {
        const currentStepIndex = signUpSteps.indexOf(currentStep) + 1;
        setCurrentStep(signUpSteps[currentStepIndex]);
    }

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
                        //setSuccess(data.message);
                        //window.location.href = DEFAULT_LOGIN_REDIRECT_URL;
                        //setStepsDone([...stepsDone, currentStep]);
                        //setMyCurrentStep();
                        window.location.reload();
                    }
                })
                .catch((error) => {
                    setError(error.data?.message);
                    console.error(error);
                });
        });
    }

    const submitBusinessData = (values: z.infer<typeof BusinessSchema>) => {
        //setResponse(undefined);

        startTransition(() => {
            createBusiness(values)
                .then(async (data) => {

                    if (data && "id" in data) {

                        setStepsDone([...stepsDone, currentStep]);
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
    };

    const submitLocationData = useCallback(
        (values: z.infer<typeof LocationSchema>) => {
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

    return (<div className="lg:pl-16 md:pl-16 lg:pr-20 md:pr-16">
            <div className="pt-5 pb-5 flex gap-4 lg:mr-16">
                {signUpSteps.map((item, index) => {
                    const isCurrent = currentStep.id === item.id || _.includes(stepsDone, item);
                    return <>
                        <div className="flex flex-col items-center justify-center flex-1">
                            <div className="flex-1 font-bold text-sm mt-3">
                                {_.includes(stepsDone, item) ?
                                    <span
                                        className="w-6 h-6 overflow-hidden bg-blue-500 rounded-full flex items-center justify-center">
                                        <CheckIcon size={16} className="text-gray-50"/>
                                    </span>
                                    : <span className={`font-bold text-center ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>}
                            </div>
                            <div className={`flex-1 font-bold text-center mt-3 ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>{item.title}</div>
                        </div>
                        {index + 1 < signUpSteps.length ?
                            <div className="flex items-center justify-center flex-1 mt-8 pl-2 lg:pr-8 md:pr-8">
                                <span className="w-[10px] h-[10px] bg-gray-400 rounded-full"></span>
                                <span className="h-[1px] bg-gray-400 w-[90%]"></span>
                                <span className="w-[10px] h-[10px] bg-gray-400 rounded-full"></span>
                            </div>
                        : <></>}
                    </>
                })}
            </div>

            {currentStep.id === "step1" ?
                <Card className="mt-6 lg:mr-10 pl-6 pr-6 pt-2 pb-5">
                    <CardHeader>
                        <CardTitle className="text-[32px] mb-3">Personal Information</CardTitle>
                        <CardDescription>
                            Enter your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormError message={error}/>
                        <FormSuccess message={success}/>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(submitData)}>
                                <div className="pl-0 pr-3 pt-2 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                    <h3 className="font-bold flex-1">Basic Information</h3>
                                    <span className="flex-end"><ChevronDownIcon/></span>
                                </div>
                                <div className="grid gap-4">
                                    <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>First Name</FormLabel>
                                                        <FormControl>
                                                            <Input disabled={isPending} placeholder="Enter first name" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                        </FormDescription>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name="lastName"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Last Name</FormLabel>
                                                        <FormControl>
                                                            <Input disabled={isPending} placeholder="Enter last name" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                        </FormDescription>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">

                                        <FormField
                                            control={form.control}
                                            name="country"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Country</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            disabled={isPending || countries.length === 0}
                                                            onValueChange={field.onChange}
                                                            value={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select your country" />
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
                                            name="phoneNumber"
                                            render={({field}) => (
                                                <FormItem className="flex flex-col mt-1">
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl className="w-full border-1 rounded-sm">
                                                    <PhoneInput
                                                        placeholder="Enter phone number"
                                                        {...field} disabled={isPending}
                                                      />
                                                    </FormControl>
                                                    <FormDescription></FormDescription>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />

                                    </div>

                                    <div
                                        className="pl-0 pr-3 pt-2 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                        <h3 className="font-bold flex-1">Login Information</h3>
                                        <span className="flex-end"><ChevronDownIcon/></span>
                                    </div>

                                    <div className="grid lg:grid-cols-2 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({field}) => (
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
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input disabled={isPending} type={showPassword ? "text" : "password"}
                                                                   placeholder="Enter password" {...field} />
                                                            <span onClick={() => setShowPassword(!showPassword)}
                                                                  className="absolute right-0 top-0 h-full w-10 flex items-center justify-center z-40 cursor-pointer">
                                                      {showPassword ? <EyeOffIcon size={20}/> :
                                                          <EyeIcon size={20}/>}</span>
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>{/* Enter user name */}</FormDescription>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <Button
                                            type="submit"
                                            disabled={isPending || emailVerified}
                                            className={`mt-4 pl-10 pr-10`}>
                                            {(isPending) ?
                                                <Loader2Icon className="w-6 h-6 animate-spin"/>:
                                                <>Next: Business info <ChevronRight/></>
                                            }
                                        </Button>
                                    </div>
                                    {/*<div className="self-end flex items-center">
                                        <span>Next: {nextStepLabel()}</span>
                                        <ChevronRight/></div>*/}
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                : (currentStep.id === "step2" || step === "step2") ?
                    <>
                        <Card className="mt-6 lg:mr-10 pl-6 pr-6 pt-2 pb-5">
                            <CardHeader>
                                <CardTitle className="text-[32px] mb-3">Verify email</CardTitle>
                            </CardHeader>
                            <CardContent>

                                <CardDescription>
                                    We have sent link with activation instruction to {session.data?.user?.email}
                                </CardDescription>
                            </CardContent>
                        </Card>

                    </>
                : (currentStep.id === "step3" || step === "step3") ? <>
                        <Card className="mt-6 lg:mr-10 md:mr-10  pl-6 pr-6 pt-2 pb-5">
                            <CardHeader>
                                <CardTitle className="text-[32px] mb-3">Business Information</CardTitle>
                                <CardDescription className="text-[18px]">Enter details for your business</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormError message={error}/>
                                <FormSuccess message={success}/>
                                <Form {...businessForm}>
                                    <form
                                        className="space-y-8"
                                        onSubmit={businessForm.handleSubmit(submitBusinessData, onInvalid)}
                                    >

                                        <div className="mt-4 flex">
                                            <label
                                                className="cursor-pointer w-20 h-20 border-1 rounded-l bg-gray-100 mr-5 flex items-center justify-center flex-col">
                                                <span><ImageIcon/></span>
                                                <span className="text-xs font-bold">Logo</span>

                                                <input
                                                    className="hidden"
                                                    type="file"
                                                    name="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        if (e.target.files) {
                                                            const formData = new FormData();
                                                            Object.values(e.target.files).forEach((file) => {
                                                                formData.append("file", file);
                                                            });

                                                            const response = await fetch("/api/upload", {
                                                                method: "POST",
                                                                body: formData,
                                                            });

                                                            const result = await response.json();
                                                            if (result.success) {
                                                                alert("Upload ok : " + result.name);
                                                            } else {
                                                                alert("Upload failed");
                                                            }
                                                        }
                                                    }}
                                                />

                                            </label>
                                            <div className="flex-1">
                                                <FormField
                                                    control={businessForm.control}
                                                    name="name"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel>Business Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter business name"
                                                                    {...field}
                                                                    disabled={isPending}
                                                                />
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid lg:grid-cols-2 md:grid-cols-2 grid-rows-1 gap-4">

                                            <FormField
                                                control={businessForm.control}
                                                name="businessType"
                                                render={({field}) => (
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
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={businessForm.control}
                                                name="country"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Country</FormLabel>
                                                        <FormControl>
                                                            <Select
                                                                disabled={isPending || countries.length === 0}
                                                                onValueChange={field.onChange}
                                                                value={field.value}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select your country"/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {countries.length > 0
                                                                        ? countries.map(
                                                                            (country: Business, index: number) => (
                                                                                <SelectItem
                                                                                    key={index}
                                                                                    value={country.id}>
                                                                                    {country.name}{" "}
                                                                                    {/* Assuming 'name' is the country name */}
                                                                                </SelectItem>
                                                                            )
                                                                        )
                                                                        : null}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 grid-rows-1 gap-4">
                                            <FormField
                                                control={businessForm.control}
                                                name="description"
                                                render={({field}) => (
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
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <div className="flex-1">

                                                <Button
                                                    type="submit"
                                                    disabled={isPending}
                                                    className={`mt-4 pl-10 pr-10`}>
                                                    {isPending ?
                                                        <Loader2Icon className="w-6 h-6 animate-spin"/> :
                                                        <> Next: Location info <ChevronRight/></>
                                                    }
                                                </Button>
                                            </div>
                                            {/*<div className="self-end flex items-center">
                                                <span>Next: {nextStepLabel()}</span>
                                                <ChevronRight/></div>*/}
                                        </div>

                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </>
                    : (currentStep.id === "step4" || step === "step4") ? <>
                            <Card className="mt-6 lg:mr-10 md:mr-10 pl-6 pr-6 pt-2 pb-5">
                                <CardHeader>
                                    <CardTitle>Setup business location</CardTitle>
                                    <CardDescription>
                                        Setup your business locations,if you have multiple locations
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>

                                    <Form {...locationForm}>
                                        <form onSubmit={locationForm.handleSubmit(submitLocationData, onInvalid)}>

                                            <div
                                                className="pl-0 pr-3 pt-2 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                                <h3 className="font-bold flex-1">Location Information</h3>
                                                <span className="flex-end"><ChevronDownIcon/></span>
                                            </div>
                                            <div className="mt-4 flex">
                                                <label
                                                    className="cursor-pointer w-20 h-20 border-1 rounded-l bg-gray-100 mr-5 flex items-center justify-center flex-col">
                                                    <span><ImageIcon/></span>
                                                    <span className="text-xs font-bold">Logo</span>

                                                    <input
                                                        className="hidden"
                                                        type="file"
                                                        name="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            if (e.target.files) {
                                                                const formData = new FormData();
                                                                Object.values(e.target.files).forEach((file) => {
                                                                    formData.append("file", file);
                                                                });

                                                                const response = await fetch("/api/upload", {
                                                                    method: "POST",
                                                                    body: formData,
                                                                });

                                                                const result = await response.json();
                                                                if (result.success) {
                                                                    alert("Upload ok : " + result.name);
                                                                } else {
                                                                    alert("Upload failed");
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                <div className="flex-1">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="name"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Location Name</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter business name"
                                                                        {...field}
                                                                        disabled={isPending}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage/>
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
                                                        render={({field}) => (
                                                            <FormItem className="flex flex-col mt-1">
                                                                <FormLabel>Phone Number</FormLabel>
                                                                <FormControl className="w-full border-1 rounded-sm">
                                                                    <PhoneInput
                                                                        placeholder="Enter phone number"
                                                                        {...field} disabled={isPending}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>{/* Enter user name */}</FormDescription>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="email"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Email</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        type="email"
                                                                        placeholder="Enter business location email"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className="pl-0 pr-3 pt-8 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                                <h3 className="font-bold flex-1">Business address</h3>
                                                <span className="flex-end"><ChevronDownIcon/></span>
                                            </div>
                                            <div className="lg:grid grid-cols-2  gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="city"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>City / Region</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        placeholder="Which city do you operate?"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="address"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Full business address</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        placeholder="Enter business location address"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            {/*<div className="lg:grid grid-cols-2 gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="region"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Region</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        placeholder="Which region do you operate?"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="street"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Street</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        placeholder="Which street do you operate?"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>*/}
                                            <div
                                                className="pl-0 pr-3 pt-8 pb-2 mb-4 border-b-1 border-b-gray-200- flex rounded-none">
                                                <h3 className="font-bold flex-1">Operating times</h3>
                                                <span className="flex-end"><ChevronDownIcon/></span>
                                            </div>
                                            <div className="lg:grid grid-cols-2 gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="openingTime"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Opening Time</FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        disabled={isPending || countries.length === 0}
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue
                                                                                placeholder="Select opening time"/>
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
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-2">

                                                    <FormField
                                                        control={locationForm.control}
                                                        name="closingTime"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Closing Time</FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        disabled={isPending || countries.length === 0}
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}>
                                                                        <SelectTrigger>
                                                                            <SelectValue
                                                                                placeholder="Select closing time"/>
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
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>


                                            <div className="flex items-center">
                                                <div className="flex-1">

                                                    <Button
                                                        type="submit"
                                                        disabled={isPending}
                                                        className={`mt-4 pl-10 pr-10`}>
                                                        {isPending ?
                                                            <Loader2Icon className="w-6 h-6 animate-spin"/> :
                                                            <> Complete <ChevronRight/></>
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

            {/*{!session?.user?
                <div className="mt-6 text-sm flex items-center font-bold">
                    <ChevronLeft size={18}/>
                    <Link href="/login">Back to login</Link>
                </div>
            :<></>}*/}
        </div>
    );
}

export default RegisterForm;
