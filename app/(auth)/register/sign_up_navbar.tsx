import React from "react";
import {NavbarTwoColumns} from "@/components/landing-page/NavbarTwoColumns";
import {Logo} from "@/components/landing-page/Logo";
import Link from "next/link";
import {ChevronRightIcon} from "@nextui-org/shared-icons";
import {UserIcon, ShieldQuestion} from "lucide-react";
import {Section} from "@/components/landing-page/Section";
import {deleteAuthCookie} from "@/lib/auth-utils";
import {useSession} from "next-auth/react";

export function SignupNavbar () {
    const {data: session} = useSession();
    const doLogout=async () => {
        await deleteAuthCookie();
        window.location.reload();
    }

    return (<div className="w-full border-b-1 bg-gray-50">
            <Section yPadding="py-2 lg:py-4 md:py-4">
                <NavbarTwoColumns logo={<Logo xl/>}>
                    {session?.user?
                        <>
                            <li className='text-medium font-bold border-1 rounded-full pl-4 pr-4 pt-2 pb-2 flex gap-1 items-center bg-emerald-500 text-lime-50'>
                                <UserIcon fontSize={20}/>
                                <Link href="#">{session.user.firstName} {session.user.lastName}</Link>
                            </li>

                            <li className='text-medium font-bold ml-3 flex items-center justify-center'>
                                <Link onClick={() => doLogout()} href={'#'}>Logout</Link>
                                <ChevronRightIcon fontSize={20}/>
                            </li>
                        </>
                    : <li className='text-medium flex font-bold ml-3 items-center justify-center'>
                            <div className="mr-3">
                                <Link href="/help" className="flex items-center justify-center">
                                    <ShieldQuestion size={22}/>
                                    <p className="text-md ml-2">Help</p>
                                </Link>
                            </div>
                            <div className="flex justify-center text-medium font-bold border-1 rounded-full pl-4 pr-4 pt-2 pb-2 gap-1 items-center bg-emerald-500 text-lime-50">
                                <Link href={'/login'}>Login</Link>
                                <ChevronRightIcon fontSize={20}/>
                            </div>
                        </li>}
                </NavbarTwoColumns>
            </Section>

        </div>
    )
}
