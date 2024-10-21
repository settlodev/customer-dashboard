"use client"
import Image from "next/image";
import Link from "next/link";
import {CheckIcon, ChevronRight} from "lucide-react";
import {usePathname} from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export const AuthLayoutWrapper = ({ children }: Props) => {
    const router = usePathname();
    const isRegisterPath = router === '/register';
    // const isLoginPath = router === '/login';
    return (<>
            <div className='flex h-screen bg-gray-100 relative'>
                <div className='hidden md:flex w-1/3 justify-center h-screen bg-[#09A87B] mr-20'>
                    <div className="relative pl-16 pr-16">
                        <div className='z-10'>
                            <div className="pt-10 pb-10 pl-3 w-full flex items-center">
                                <div className="flex-1">
                                    <Image
                                        src="/images/new_logo_white.svg"
                                        height={50}
                                        width={200}
                                        alt="Settlo"
                                    />
                                </div>

                                {isRegisterPath?
                                <Link href="/login" className="self-end flex items-center justify-center gap-1">
                                    <span className="text-gray-50 font-bold text-md">Go to login</span>
                                    <ChevronRight size={18} color={'#FFFFFF'}/>
                                </Link>:<></>}
                            </div>

                            <div
                                className='font-medium text-slate-400 mt-4 ml-3 bg-[rgba(255,255,255,.1)] rounded-md'>
                                <div className="p-10">
                                <div className="mb-5">
                                    <h3 className="font-bold text-[30px] text-white">Sign up to get started</h3>
                                    {/*<p className="text-gray-50 text-[18px]">Get 30-day free trial</p>*/}
                                </div>

                                <div className="flex mb-5">
                                    <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[22px] text-gray-200">30-day free trial</h3>
                                        <p className="text-gray-300 text-md">Use your free trial period to test and
                                            staff training</p>
                                    </div>
                                </div>
                                <div className="flex mb-5">
                                    <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[22px]  text-gray-100">Supports multiple
                                            businesses</h3>
                                        <p className="text-gray-300 text-md">Manage and monitor all your businesses
                                            under one account.</p>
                                    </div>
                                </div>
                                <div className="flex mb-5">
                                    <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[22px]  text-gray-100">Multi-user
                                            capability</h3>
                                        <p className="text-gray-300 text-md">Manage all your staff from all your
                                            business locations.</p>
                                    </div>
                                </div>
                                <div className="flex mb-5">
                                    <div className="flex w-8 mr-4 mt-1.5">
                                        <span
                                            className="w-6 h-6 overflow-hidden rounded-full flex items-center justify-center">
                                            <CheckIcon size={18} className="text-white"/>
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[22px]  text-gray-100">Secured data
                                            access</h3>
                                        <p className="text-gray-300 text-md">Your business data is protected with
                                            passwords and passcodes.</p>
                                    </div>
                                </div>
                                </div>


                                <div className='pl-10 pr-10 pb-10 flex gap-6 border-t-1 border-t-[rgba(255,255,255,.4)] pt-6'>
                                    <div
                                        className="flex flex-1 gap-2 items-center border-1 rounded-xl p-2 pl-4 pr-3 bg-gray-800">
                                        <div>
                                            <Image src="/images/apple.svg" width={40} height={40} alt='Apple AppStore'/>
                                        </div>
                                        <p className="text-sm font-bold text-center text-white">AppStore</p>
                                    </div>

                                    <div
                                        className="flex flex-1 gap-2 items-center border-1 rounded-xl p-2 pl-4 pr-3 bg-gray-800">
                                        <div>
                                            <Image src="/images/google-play.svg" width={40} height={40}
                                                   alt='Google PlayStore'/>
                                        </div>
                                        <p className="text-sm font-bold text-center text-white">PlayStore</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 pl-4">
                                <span className="mr-5 text-gray-200">About us</span>
                                <span className="mr-5 text-gray-200">Terms & Conditions</span>
                                <span className="mr-5 text-gray-200">Contact</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex-1 pt-32'>{children}</div>
            </div>
        </>
    )
}
