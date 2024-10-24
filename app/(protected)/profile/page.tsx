"use client"
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import React, {useState} from "react";
const breadcrumbItems = [{ title: "Profile", link: "/profile" }];
import Image from "next/image";
import {PhoneCallIcon, UploadIcon, UserIcon, VerifiedIcon} from "lucide-react";
import {EnvelopeClosedIcon} from "@radix-ui/react-icons";
import {EditIcon} from "@nextui-org/shared-icons";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import {useSession} from "next-auth/react";
export default function Page() {
    const [imageUrl, setImageUrl] = useState<string>('');
    const session = useSession();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems}/>
                </div>
            </div>

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
                                <form action="#">
                                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                        <div className="w-full sm:w-1/2">
                                            <label
                                                className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                htmlFor="fullName"
                                            >
                                                Full Name
                                            </label>
                                            <div className="relative">
                                            <span className="absolute left-4.5 top-4">
                                              <UserIcon size={20}/>
                                            </span>
                                                <input
                                                    className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                    type="text"
                                                    name="fullName"
                                                    id="fullName"
                                                    placeholder="First Name"
                                                    defaultValue={session?.data?.user.firstName}
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full sm:w-1/2">
                                            <label
                                                className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                htmlFor="fullName"
                                            >
                                                Full Name
                                            </label>
                                            <div className="relative">
                                            <span className="absolute left-4.5 top-4">
                                              <UserIcon size={20}/>
                                            </span>
                                                <input
                                                    className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                                    type="text"
                                                    name="fullName"
                                                    id="fullName"
                                                    placeholder="First Name"
                                                    defaultValue={session?.data?.user.lastName}
                                                />
                                            </div>
                                        </div>

                                    </div>

                                    <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                                        <div className="w-full sm:w-1/2">
                                            <label
                                                className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                htmlFor="phoneNumber"
                                            >
                                                Phone Number
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
                                                    name="phoneNumber"
                                                    id="phoneNumber"
                                                    placeholder="Phone number"
                                                    defaultValue={session?.data?.user.phoneNumber}
                                                    disabled={true}
                                                />
                                            </div>
                                            </div>

                                            <div className="w-full sm:w-1/2">

                                                <label
                                                    className="mb-3 block text-sm font-medium text-black dark:text-white"
                                                    htmlFor="emailAddress"
                                                >
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
                                                        name="emailAddress"
                                                        id="emailAddress"
                                                        placeholder="Email address"
                                                        defaultValue={session?.data?.user.email}
                                                        disabled={true}
                                                    />
                                                </div>
                                            </div>
                                    </div>
                                    <div className="mb-5.5">
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
                                                name="bio"
                                                id="bio"
                                                rows={6}
                                                placeholder="Write your bio here"
                                                defaultValue=""
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4.5">
                                        <button
                                            className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                                            type="submit"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
                                            type="submit"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>
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
                                <form action="#">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div
                                            className="h-14 w-14 rounded-full overflow-hidden border-2 border-emerald-300">
                                            <Image
                                                src={imageUrl ? imageUrl : (session?.data?.user.image ? session?.data?.user.image : "/images/logo.png")}
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

                                    <div className="flex justify-end gap-4.5">
                                        <button
                                            className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                                            type="submit"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
                                            type="submit"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
