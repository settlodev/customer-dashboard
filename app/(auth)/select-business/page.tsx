import * as Sentry from "@sentry/nextjs";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import BusinessSelector from "@/app/(auth)/select-business/business_list";

import Loading from "@/components/ui/loading";
import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import { AuthenticationError } from "@/lib/settlo-api-client";

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
    await new Promise((resolve) => setTimeout(resolve, 100));

    const data = await getBusinessDropDown();

    if (!data) {
      redirect("/login");
    }

    if (Array.isArray(data) && data.length > 0) {
      return <BusinessSelector businesses={data} />;
    }

    redirect("/business-registration");
  } catch (error) {
    // ✅ Always redirect auth errors to login
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }

    Sentry.captureException(error);

    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

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
