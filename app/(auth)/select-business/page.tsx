import * as Sentry from "@sentry/nextjs";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import BusinessSelector from "@/app/(auth)/select-business/business_list";
import { fetchAllBusinesses } from "@/lib/actions/business-actions";
import Loading from "@/app/loading";

function BusinessPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  );
}

async function BusinessPageContent() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const data = await fetchAllBusinesses();

    if (Array.isArray(data) && data.length > 0) {
      return <BusinessSelector businesses={data} />;
    }

    redirect("/business-registration");
  } catch (error) {
    Sentry.captureException(error);

    // Re-throw redirect errors
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
  }
}

export default async function SelectBusinessPage() {
  return (
    <Suspense fallback={<BusinessPageLoading />}>
      <BusinessPageContent />
    </Suspense>
  );
}
