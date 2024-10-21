import React from "react";
import {NavbarTwoColumns} from "@/components/landing-page/NavbarTwoColumns";
import {Logo} from "@/components/landing-page/Logo";
import Link from "next/link";
import {ChevronRightIcon} from "@nextui-org/shared-icons";
import {UserIcon} from "lucide-react";
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
            {session?.user?
            <Section yPadding="py-6">
                <NavbarTwoColumns logo={<Logo xl/>}>
                    <li className='text-medium font-bold border-1 rounded-full pl-4 pr-4 pt-2 pb-2 flex gap-1 items-center bg-emerald-500 text-lime-50'>
                        <UserIcon fontSize={20}/>
                        <Link href="#">{session.user.firstName} {session.user.lastName}</Link>
                    </li>

                    <li className='text-medium font-bold ml-3 flex items-center justify-center'>
                        <Link onClick={() => doLogout()} href={'#'}>Logout</Link>
                        <ChevronRightIcon fontSize={20}/>
                    </li>
                </NavbarTwoColumns>
            </Section> : <></>}

        </div>
    )
}
