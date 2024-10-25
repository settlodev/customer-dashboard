"use client"
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import React, {useCallback, useEffect, useState, useTransition} from "react";
const breadcrumbItems = [{ title: "Profile", link: "/profile" }];
import Image from "next/image";
import {Loader2Icon, PhoneCallIcon, UploadIcon, UserIcon, VerifiedIcon} from "lucide-react";
import {EnvelopeClosedIcon} from "@radix-ui/react-icons";
import {EditIcon} from "@nextui-org/shared-icons";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import {useSession} from "next-auth/react";
import {FieldErrors, useForm} from "react-hook-form";
import {z} from "zod";
import {UpdateUserSchema} from "@/types/data-schemas";
import {zodResolver} from "@hookform/resolvers/zod";
import {getUserById, updateUser} from "@/lib/actions/auth-actions";
import {ExtendedUser, FormResponse} from "@/types/types";
import {FormError} from "@/components/widgets/form-error";
import {FormSuccess} from "@/components/widgets/form-success";
import {Form, FormField, FormItem} from "@/components/ui/form";
import {useToast} from "@/hooks/use-toast";
import {Button} from "@/components/ui/button";

export default function UpdateProfileForm() {
    const session = useSession();
    console.log("session:", session.data?.user.phoneNumber);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [success] = useState<string | undefined>("");
    const [user, setUser] = useState<ExtendedUser | null>(null);

    useEffect(() => {
        async function getMyUser() {
            const mUser = await getUserById(session.data?.user?.id);
            console.log("mUser:", mUser);
            setUser(mUser);
        }
        getMyUser();
    }, []);

    const form = useForm<z.infer<typeof UpdateUserSchema>>({
        resolver: zodResolver(UpdateUserSchema),
        defaultValues:{
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email,
            phoneNumber: user?.phoneNumber,
            role: user?.role,
            country: user?.country,
            bio: user?.bio,
        }
    });
    const {toast} = useToast();
    const onInvalid = useCallback(
        (errors: FieldErrors) => {
            console.log("errors", errors);
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

    const submitData = async (values: z.infer<typeof UpdateUserSchema>) => {
        if (imageUrl) {
            values.image = imageUrl;
        }

        values.role = user?.role;
        values.country = user?.country;

        console.log("values:", values);
        startTransition(() => {
            updateUser(values)
                .then((data: FormResponse) => {
                    console.log("data is:", data);
                    if (!data) {
                        setError("An unexpected error occurred. Please try again.");
                        return;
                    }
                    if (data.responseType === "error") {
                        setError(data.message);
                    } else {

                    }
                })
                .catch((error) => {
                    setError(error.data?.message);
                    console.error("error:", error);
                });
        });
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems}/>
                </div>
            </div>
            <FormError message={error}/>
            <FormSuccess message={success}/>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(submitData, onInvalid)} method="POST">
                    <div
                        className="overflow-hidden">
                        <div className="grid grid-cols-5 gap-8">
                            <div className="col-span-5 xl:col-span-3">
                                <div
                                    className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                                    <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                                        <h3 className="font-medium text-black dark:text-white">
                                            Personal Information
                                        </h3>
                                    </div>
                                    <div className="p-7">
                                        <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                            <div className="w-full sm:w-1/2">
                                                <FormField
                                                    control={form.control}
                                                    name="firstName"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <label
                                                                className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                                htmlFor="firstName"
                                                            >
                                                                First Name
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-4.5 top-4">
                                                                  <UserIcon size={20}/>
                                                                </span>
                                                                <input
                                                                    className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                                    type="text"
                                                                    id="firstName"
                                                                    disabled={isPending}
                                                                    placeholder="First Name"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="w-full sm:w-1/2">
                                                <FormField
                                                    control={form.control}
                                                    name="lastName"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <label
                                                                className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                                htmlFor="lastName">
                                                                Last Name
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-4.5 top-4">
                                                                  <UserIcon size={20}/>
                                                                </span>
                                                                <input
                                                                    className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                                    type="text"
                                                                    disabled={isPending}
                                                                    id="lastName"
                                                                    placeholder="First Name"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormItem>
                                                    )}/>
                                            </div>
                                        </div>

                                        <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                            <div className="w-full sm:w-1/2">
                                                <FormField
                                                    control={form.control}
                                                    name="phoneNumber"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <label
                                                                className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                                htmlFor="phoneNumber">Phone Number
                                                            </label>

                                                            <div className="relative">
                                                                <span className="absolute left-4.5 top-4">
                                                                  <PhoneCallIcon size={18}/>
                                                                </span>
                                                                <span className="absolute right-4.5 top-4">
                                                                  <VerifiedIcon className="text-emerald-500" size={18}/>
                                                                </span>
                                                                <input
                                                                    className="w-full pl-11.5 pr-4.5 rounded border border-stroke bg-gray px-4.5 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                                    type="text"
                                                                    id="phoneNumber"
                                                                    placeholder="Phone number"
                                                                    readOnly={true}
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormItem>
                                                    )}/>
                                            </div>

                                            <div className="w-full sm:w-1/2">
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({field}) => (
                                                        <FormItem>
                                                        <label
                                                            className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                            htmlFor="emailAddress">
                                                            Email Address
                                                        </label>
                                                        <div className="relative">
                                                              <span className="absolute left-4.5 top-4">
                                                                <EnvelopeClosedIcon/>
                                                              </span>
                                                            <span className="absolute right-4.5 top-4">
                                                              <VerifiedIcon className="text-emerald-500" size={18}/>
                                                            </span>
                                                            <input
                                                                className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                                type="email"
                                                                id="emailAddress"
                                                                placeholder="Email address"

                                                                readOnly={true}
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormItem>)}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-5.5">
                                            <FormField
                                                control={form.control}
                                                name="bio"
                                                render={({field}) => (
                                                    <FormItem>
                                                    <label
                                                        className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                        htmlFor="Username">
                                                        BIO
                                                    </label>
                                                    <div className="relative">
                                                      <span className="absolute left-4.5 top-4">
                                                        <EditIcon/>
                                                      </span>
                                                        <textarea
                                                            className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                            id="bio"
                                                            rows={6}
                                                            placeholder="Write your bio here"
                                                            {...field}></textarea>
                                                    </div>
                                                </FormItem>)}
                                            />
                                        </div>

                                        <div className="flex gap-4.5">

                                            <Button
                                                type="submit"
                                                disabled={isPending}
                                                className={`mt-4 pl-10 pr-10`}>
                                                {isPending ?
                                                    <Loader2Icon className="w-6 h-6 animate-spin"/> :
                                                    <>Update profile</>
                                                }
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-5 xl:col-span-2">
                                <div
                                    className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                                    <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                                        <h3 className="font-medium text-black dark:text-white">
                                            Your Photo
                                        </h3>
                                    </div>
                                    <div className="p-7">

                                        <div className="mb-4 flex items-center gap-3">
                                            <div
                                                className="h-14 w-14 rounded-full overflow-hidden border-2 border-emerald-300">
                                                <Image
                                                    src={imageUrl ? imageUrl : (user && user.image ? user.image : "/images/logo.png")}
                                                    width={200}
                                                    height={200}
                                                    alt="User"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                      <span className="mb-1.5 text-black font-bold dark:text-white">
                                        Edit your photo
                                      </span>
                                            </div>
                                        </div>

                                        <label
                                            className="relative mb-5.5 block w-full cursor-pointer appearance-none rounded border border-dashed border-primary bg-gray px-4 py-4 dark:bg-meta-4 sm:py-7.5">
                                            <div className="hidden">
                                                <UploadImageWidget setImage={setImageUrl} imagePath={'profiles'}/>
                                            </div>
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                          <span
                                              className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                                            <UploadIcon/>
                                          </span>
                                                <p>
                                                    <span className="text-primary">Click to upload</span> or
                                                    drag and drop
                                                </p>
                                                <p className="mt-1.5">PNG, JPG</p>
                                            </div>
                                        </label>

                                        <div className="flex gap-4.5">
                                            <Button
                                                type="submit"
                                                disabled={isPending}
                                                className={`mt-4 pl-10 pr-10`}>
                                                {isPending ?
                                                    <Loader2Icon className="w-6 h-6 animate-spin"/> :
                                                    <>Update photo</>
                                                }
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}
