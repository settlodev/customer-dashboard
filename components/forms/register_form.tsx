"use client"

import Link from "next/link";
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
import { RegisterSchema } from "@/types/data-schemas";
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

import { FormResponse } from "@/types/types";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import { register } from "@/lib/actions/auth-actions";
import {
    CheckIcon,
    EyeIcon,
    EyeOffIcon,
    Loader2Icon,
    ChevronRight,
    ChevronLeft,
    ChevronDownIcon,
    ImageIcon
} from "lucide-react";
import { fetchCountries } from "@/lib/actions/countries-actions";
import { Country } from "@/types/country/type";
import _ from "lodash";
import {BusinessSchema} from "@/types/business/schema";
import {createBusiness} from "@/lib/actions/auth/business";
import {toast, useToast} from "@/hooks/use-toast";
import {Business} from "@/types/business/type";
import BusinessTypeSelector from "@/components/widgets/business-type-selector";
import {Textarea} from "@/components/ui/textarea";
import {LocationSchema} from "@/types/location/schema";
import {createBusinessLocation} from "@/lib/actions/auth/location";
import { PhoneInput } from "../ui/phone-input";
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
        title: "Business Info",
    },
    {
        id: "step3",
        label: "03",
        title: "Location Info",
    }
]

function RegisterForm({step}:{step: string}) {
    const mCurrentStep = step?signUpSteps[_.findIndex(signUpSteps, {id: step})]:signUpSteps[0];
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [countries, setCountries] = useState([]);
    const [stepsDone, setStepsDone] = useState<signUpStepItemType[]>([]);
    const [addStep, setAddStep] = useState(null);
    const [currentStep, setCurrentStep] = useState<signUpStepItemType>(mCurrentStep);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    /*TODO: Business form information*/
    const {toast} = useToast();
    const [, setResponse] = useState<FormResponse | undefined>();

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {},
    });

    const businessForm = useForm<z.infer<typeof BusinessSchema>>({
        resolver: zodResolver(BusinessSchema),
        defaultValues: {},
    });

    const locationForm = useForm<z.infer<typeof LocationSchema>>({
        resolver: zodResolver(LocationSchema),
        defaultValues: {},
    });

    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: typeof errors.message === 'string'
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
            console.log("step is:", step);
            if(step === "step2"){
                setStepsDone([...stepsDone, signUpSteps[0]])
            }
            if(step === "step3"){
                const doneSteps = [...stepsDone, signUpSteps[0], signUpSteps[1]];
                console.log("Done steps: ", doneSteps)
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
                        setStepsDone([...stepsDone, currentStep]);
                        setMyCurrentStep();
                        location.reload();
                    }
                })
                .catch((error) => {
                    setError("An unexpected error occurred. Please try again.");
                    console.error(error);
                });
        });
    }

    const submitBusinessData = (values: z.infer<typeof BusinessSchema>) => {
        setResponse(undefined);

        startTransition(() => {
            createBusiness(values)
                .then(async (data) => {

                    if (data && "id" in data) {

                        setStepsDone([...stepsDone, currentStep]);
                        setMyCurrentStep();
                        location.reload();
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

                            //setStepsDone([...stepsDone, currentStep]);
                            //setMyCurrentStep();
                            /*setResponse(data);
                            toast({
                                variant: "default",
                                title: "Business created successfully",
                                description: data.message,
                            });*/

                            location.href = "/dashboard";

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

    const nextStepLabel=()=>{
        const currentIndex = signUpSteps.indexOf(currentStep);
        const nextIndex = currentIndex+1;
        if(nextIndex <= signUpSteps.length) {
            return signUpSteps[nextIndex]?.title
        }else{
            return 'Finish';
        }
    }

    return (<div className="pl-16 pr-20">
            <div className="pt-5 pb-5 flex gap-4 mr-16">
                {signUpSteps.map((item, index) => {
                    const isCurrent = currentStep.id === item.id || _.includes(stepsDone, item);
                    return <>
                        <div className="flex flex-col items-center justify-center flex-1">
                            <div className="flex-1 font-bold text-md mt-3">
                                {_.includes(stepsDone, item) ?
                                    <span
                                        className="w-6 h-6 overflow-hidden bg-blue-500 rounded-full flex items-center justify-center">
                                        <CheckIcon size={16} className="text-gray-50"/>
                                    </span>
                                    : <span
                                        className={`font-bold text-md ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>}
                            </div>
                            <div
                                className={`flex-1 font-bold text-md mt-3 ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>{item.title}</div>
                        </div>
                        {index + 1 < signUpSteps.length ?
                            <div className="flex items-center justify-center flex-1 mt-8 pl-2 pr-8">
                                <span className="w-[10px] h-[10px] bg-gray-400 rounded-full"></span>
                                <span className="h-[1px] bg-gray-400 w-[90%]"></span>
                                <span className="w-[10px] h-[10px] bg-gray-400 rounded-full"></span>
                            </div>
                            : <></>}
                    </>
                })}
            </div>

            {currentStep.id === "step1" ?
                <Card className="mt-6 mr-10 pl-6 pr-6 pt-2 pb-5">
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>First Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter first name" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {/* Enter user name */}
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
                                                            <Input placeholder="Enter last name" {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {/* Enter user name */}
                                                        </FormDescription>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">

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
                                                            value={field.value}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select your country"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {countries.length > 0
                                                                    ? countries.map((country: Country, index: number) => (
                                                                        <SelectItem key={index} value={country.id}>
                                                                            {country.name}{" "}
                                                                            {/* Assuming 'name' is the country name */}
                                                                        </SelectItem>
                                                                    ))
                                                                    : null}
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
                                                <FormItem className="flex flex-col items-center mt-1">
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl className="w-full border-1 rounded-sm">
                                                    <PhoneInput
                                                        placeholder="Enter phone number"
                                                        {...field}
                                                      />
                                                    </FormControl>
                                                    <FormDescription>{/* Enter user name */}</FormDescription>
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

                                    <div className="grid grid-cols-2 gap-4">
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
                                                            <Input type={showPassword ? "text" : "password"}
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
                                            disabled={isPending}
                                            className={`mt-4 pl-10 pr-10`}>
                                            {isPending ?
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
                : (currentStep.id === "step2" || step === "step2") ? <>
                        <Card className="mt-6 mr-10 pl-6 pr-6 pt-2 pb-5">
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

                                        <div className="grid grid-cols-2 grid-rows-1 gap-4">

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
                                                                value={field.value}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select your country"/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {countries.length > 0
                                                                        ? countries.map(
                                                                            (country: Business, index: number) => (
                                                                                <SelectItem
                                                                                    key={index}
                                                                                    value={country.id}
                                                                                >
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
                    : (currentStep.id === "step3" || step === "step3") ? <>
                            <Card className="mt-6 mr-10 pl-6 pr-6 pt-2 pb-5">
                                <CardHeader>
                                    <CardTitle>Setup Business Location</CardTitle>
                                    <CardDescription>
                                        Setup your business locations,if you have multiple locations
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>

                                    <Form {...locationForm}>
                                        <form onSubmit={locationForm.handleSubmit(submitLocationData, onInvalid)}>

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
                                            <div className="lg:grid grid-cols-2 gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="phone"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Phone Number</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        placeholder="Enter business location phone number"
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
                                            <div className="lg:grid grid-cols-2  gap-4 mt-2">
                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="address"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>Location Address</FormLabel>
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

                                                <div className="grid gap-2">
                                                    <FormField
                                                        control={locationForm.control}
                                                        name="city"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel>City</FormLabel>
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
                                            </div>
                                            <div className="lg:grid grid-cols-2 gap-4 mt-2">
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
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        placeholder="HH:MM (24 hour format)"
                                                                        pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                                                                        title="Please enter time in 24-hour format (HH:mm)"
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    When do you open your business location?
                                                                </FormDescription>
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
                                                                    <Input
                                                                        {...field}
                                                                        disabled={isPending}
                                                                        placeholder="HH:MM (24 hour format)"
                                                                        pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                                                                        title="Please enter time in 24-hour format (HH:mm)"
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    When do you close your business location?
                                                                </FormDescription>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-2 mt-2">
                                                <FormField
                                                    control={locationForm.control}
                                                    name="description"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel>Description of your business location</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    {...field}
                                                                    disabled={isPending}
                                                                    placeholder="Describe your business location"
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

            {currentStep.id === 'step1' ?
                <div className="mt-6 text-sm flex items-center font-bold">
                    <ChevronLeft size={18}/>
                    <Link href="/login">Back to login</Link>
                </div>
                : <></>}
        </div>
    );
}

export default RegisterForm;
