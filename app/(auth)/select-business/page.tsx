import * as Sentry from "@sentry/nextjs";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import BusinessSelector from "@/app/(auth)/select-business/business_list";

import Loading from "@/components/ui/loading";
import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";

export const dynamic = "force-dynamic";

function BusinessPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  );
}

async function BusinessPageContent() {
  try {
    const data = await getBusinessDropDown();

    if (!data || !Array.isArray(data) || data.length === 0) {
      redirect("/business-registration");
    }

    // Pass all businesses to the client component.
    // Auto-selection (single business, single location → dashboard)
    // is handled client-side where server actions can set cookies.
    return <BusinessSelector businesses={data} />;
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      (error as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    Sentry.captureException(error);
    redirect("/login");
  }
}

export default async function SelectBusinessPage() {
  return (
    <Suspense fallback={<BusinessPageLoading />}>
      <BusinessPageContent />
    </Suspense>
  );
}
