
import * as Sentry from "@sentry/nextjs";
import { Suspense } from 'react';
import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import BusinessSelector from "@/app/(auth)/select-business/business_list";
// import { Loader2Icon } from "lucide-react";
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
        // Middleware ensures auth, just fetch data
        const data = await getBusinessDropDown();
        
        // Handle the case where data might be null or empty
        if (!data || data.length === 0) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">No businesses found.</p>
                        <a href="/business-registration" className="text-white bg-emerald-500 px-4 py-2 rounded-full hover:underline">
                            Create your first business
                        </a>
                    </div>
                </div>
            );
        }

        return <BusinessSelector businesses={data} />;
    } catch (error) {
        Sentry.captureException(error);
        
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Something went wrong.</p>
                    <a href="/login" className="text-emerald-600 hover:underline">
                        Go to login
                    </a>
                </div>
            </div>
        );
    }
}

export default async function SelectBusinessPage() {
    return (
        <Suspense fallback={<BusinessPageLoading />}>
            <BusinessPageContent />
        </Suspense>
    );
}