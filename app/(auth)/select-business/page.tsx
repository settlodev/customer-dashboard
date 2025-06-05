import * as Sentry from "@sentry/nextjs";
import { redirect } from 'next/navigation';

import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import BusinessSelector from "@/app/(auth)/select-business/business_list";
import { auth } from "@/auth";

export default async function SelectBusinessPage() {
    try {
        const session = await auth();
        if (!session) {
            redirect('/login');
        }

        const data = await getBusinessDropDown();
        if (data === null) {
            redirect('/login');
        }

        if (data.length === 0) {
            redirect('/business-registration');
        }

        return <BusinessSelector businesses={data} />;
    } catch (error) {
        Sentry.captureException(error);
        redirect('/login');
    }
}
