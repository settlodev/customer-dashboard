import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import React from "react";
const breadcrumbItems = [{ title: "Suppliers", link: "/suppliers" }];
import Image from "next/image";
import {auth} from "@/auth";
import {PencilIcon} from "lucide-react";
export default async function Page() {

    const session = await auth();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 md:max-w-md">
                    <BreadcrumbsNav items={breadcrumbItems}/>
                </div>
            </div>


            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

                <div className="px-4 pb-6 text-center lg:pb-8 xl:pb-11.5">
                    <div
                        className="relative z-30 mx-auto mt-6 h-30 w-full max-w-30 rounded-full bg-white/20 p-1 backdrop-blur sm:h-44 sm:max-w-44 sm:p-3">
                        <div className="relative drop-shadow-2">
                            <Image
                                src={session?.user.image?session?.user.image: "/images/logo.png"}
                                width={160}
                                height={160}
                                style={{
                                    width: "auto",
                                    height: "auto",
                                }}
                                alt="profile"
                            />
                            <label
                                htmlFor="profile"
                                className="absolute bottom-0 right-0 flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-full bg-primary text-white hover:bg-opacity-90 sm:bottom-2 sm:right-2"
                            >
                                <PencilIcon />
                                <input
                                    type="file"
                                    name="profile"
                                    id="profile"
                                    className="sr-only"
                                />
                            </label>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="mb-1.5 text-2xl font-semibold text-black dark:text-white">
                            {session?.user.firstName} {session?.user.lastName}
                        </h3>
                        <p className="font-medium">{session?.user.email}</p>
                        {/*<div
                            className="mx-auto mb-5.5 mt-4.5 grid max-w-94 grid-cols-3 rounded-md border border-stroke py-2.5 shadow-1 dark:border-strokedark dark:bg-[#37404F]">
                            <div
                                className="flex flex-col items-center justify-center gap-1 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
                  <span className="font-semibold text-black dark:text-white">
                    259
                  </span>
                                <span className="text-sm">Businesses</span>
                            </div>
                            <div
                                className="flex flex-col items-center justify-center gap-1 border-r border-stroke px-4 dark:border-strokedark xsm:flex-row">
                  <span className="font-semibold text-black dark:text-white">
                    129K
                  </span>
                                <span className="text-sm">Followers</span>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1 px-4 xsm:flex-row">
                  <span className="font-semibold text-black dark:text-white">
                    2K
                  </span>
                                <span className="text-sm">Following</span>
                            </div>
                        </div>*/}

                        <div className="mx-auto max-w-180">
                            <h4 className="font-semibold text-black dark:text-white">
                                About Me
                            </h4>
                            <p className="mt-4.5">

                            </p>
                        </div>

                    </div>
                </div>
            </div>


        </div>
    );
}
