
import * as Sentry from "@sentry/nextjs";
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import BusinessSelector from "@/app/(auth)/select-business/business_list";
import { auth } from "@/auth";
import { Loader2Icon } from "lucide-react";

// Loading component for suspense
function BusinessPageLoading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <Loader2Icon className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading your businesses...</p>
            </div>
        </div>
    );
}


async function BusinessPageContent() {
    try {
        const session = await auth();
        if (!session) {
            redirect('/login');
        }

        
        const data = await getBusinessDropDown();
        
        console.log("Business fetch result:", { 
            dataExists: !!data, 
            dataLength: data?.length,
            sessionUserId: session?.user?.id
        });

        if (data === null) {
            
            redirect('/login');
        }

        if (data.length === 0) {
            
            redirect('/business-registration');
        }

        return <BusinessSelector businesses={data} />;
    } catch (error) {
        // console.error('Error in BusinessPageContent:', error);
        Sentry.captureException(error);
        
        // More specific error handling
        if (error instanceof Error && error.message.includes('REDIRECT')) {
            // Re-throw redirect errors
            throw error;
        }
        
        redirect('/login');
    }
}

export default async function SelectBusinessPage() {
    return (
        <Suspense fallback={<BusinessPageLoading />}>
            <BusinessPageContent />
        </Suspense>
    );
}