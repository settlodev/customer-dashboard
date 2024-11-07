import React from "react";
import Link from "next/link";
import {ChevronRightIcon} from "@nextui-org/shared-icons";
import {UserIcon, ShieldQuestion} from "lucide-react";
import {Section} from "@/components/landing-page/Section";
import {deleteAuthCookie} from "@/lib/auth-utils";
import {useSession} from "next-auth/react";
import {Navbar} from "@nextui-org/navbar";
import {NavbarBrand} from "@nextui-org/react";
import Image from "next/image";
import {Button} from "@/components/ui/button";

export function SignupNavbar () {
    const {data: session} = useSession();
    const doLogout=async () => {
        await deleteAuthCookie();
        window.location.reload();
    }

    return (<div className="w-full border-b-1 bg-gray-50">
             <Section yPadding="py-2 lg:py-4 md:py-4">
                <Navbar>
                    <NavbarBrand>
                        <Link href="/" className="flex items-center">
                            <div className="relative h-8 w-8 mr-2">
                                <Image
                                    src="/images/logo.png"
                                    alt="Logo"
                                    fill
                                    sizes="32px"
                                    className="cursor-pointer object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-xl font-bold text-black">Settlo Pro</span>
                        </Link>
                    </NavbarBrand>
                    {session?.user?
                        <>
                            <li className='text-medium font-bold border-1 rounded-full pl-4 pr-4 pt-2 pb-2 text-emerald-500 flex gap-1 items-center border-emerald-500'>
                                <UserIcon fontSize={20}/>
                                <Link href="#">{session.user.firstName} {session.user.lastName}</Link>
                            </li>

                            <li className='text-medium font-bold ml-4 flex items-center justify-center'>
                                <Link onClick={() => doLogout()} href={'#'}>Logout</Link>
                                <ChevronRightIcon fontSize={20}/>
                            </li>
                        </>
                    : <li className='text-medium flex font-bold ml-3 items-center justify-center'>
                            <div className="mr-3">
                                <Link href="mailto:support@settlo.co.tz" className="flex items-center justify-center">
                                    <ShieldQuestion size={22}/>
                                    <p className="text-md ml-2">Help</p>
                                </Link>
                            </div>

                            <Button className="text-medium rounded-full font-bold bg-emerald-500 text-lime-50 pl-4 pr-4">
                                <Link href={'/login'}>Login</Link>
                                <ChevronRightIcon fontSize={20}/>
                            </Button>
                        </li>}
                </Navbar>
            </Section>

        </div>
    )
}
