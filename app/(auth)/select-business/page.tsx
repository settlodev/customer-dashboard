import * as Sentry from "@sentry/nextjs";

import { redirect } from 'next/navigation';
import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import BusinessSelector from "@/app/(auth)/select-business/business_list";
import { auth } from "@/auth";
import { signOut } from "next-auth/react";

export default async function SelectBusinessPage() {
    try {
        const session = await auth();
        if (!session) {
            await signOut();
            redirect('/login');
        }

        const data = await getBusinessDropDown();
        if (data === null) {
            await signOut();
            redirect('/login');
        }

        if (data.length === 0) {
            redirect('/business-registration');
        }

        return <BusinessSelector businesses={data} />;
    } catch (error) {
        Sentry.captureException(error);
        // await signOut();
        redirect('/login');
    }
}
