import * as Sentry from "@sentry/nextjs";
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import BusinessSelector from "@/app/(auth)/select-business/business_list";
import Loading from "@/app/(protected)/loading";

function BusinessPageLoading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
           <Loading />
        </div>
    );
}

async function BusinessPageContent() {
    try {

        
        await new Promise(resolve => setTimeout(resolve, 100));

        // Middleware ensures auth, just fetch data
        const data = await getBusinessDropDown();
    
        // Handle redirects properly in server component
        if (!data) {
            // redirect('/login');
            redirect('/login');
        }
        
        if (Array.isArray(data) && data.length > 0) {
            return <BusinessSelector businesses={data} />;
        }
            redirect('/business-registration');
        
        
    } catch (error) {
        Sentry.captureException(error);
        
        // Re-throw redirect errors
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error;
        }

       
        
        // For other errors, redirect to login
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

