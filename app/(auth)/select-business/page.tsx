import * as Sentry from "@sentry/nextjs";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import BusinessSelector from "@/app/(auth)/select-business/business_list";

import Loading from "@/components/ui/loading";
import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { getBusinessDropDown } from "@/lib/actions/business/get-current-business";
import RetryButton from "@/app/(auth)/select-business/retry-button";
import { getMyAccountsContext } from "@/lib/actions/profile-actions";
import { SelectBusinessEmptyState } from "@/app/(auth)/select-business/empty-state";

export const dynamic = "force-dynamic";

function BusinessPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  );
}

async function BusinessPageContent() {
  let data: Awaited<ReturnType<typeof getBusinessDropDown>>;
  try {
    data = await getBusinessDropDown();
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    Sentry.captureException(error);

    return (
      <div className="w-full max-w-md mx-auto">
        <Alert tone="danger" variant="soft">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t load your businesses</AlertTitle>
            <AlertDescription>
              Something went wrong reaching our servers. Your account is fine —
              please try again in a moment.
            </AlertDescription>
            <div className="pt-2">
              <RetryButton />
            </div>
          </AlertBody>
        </Alert>
      </div>
    );
  }

  if (data.length === 0) {
    const { accounts, currentAccountId } = await getMyAccountsContext();
    const others = accounts.filter((a) => a.id !== currentAccountId);
    if (others.length > 0) {
      return <SelectBusinessEmptyState others={others} />;
    }
    // Genuine "no businesses and no other accounts" — new owner.
    redirect("/business-registration");
  }

  // Pass all businesses to the client component.
  // Auto-selection (single business, single location → dashboard)
  // is handled client-side where server actions can set cookies.
  return <BusinessSelector businesses={data} />;
}

export default async function SelectBusinessPage() {
  return (
    <Suspense fallback={<BusinessPageLoading />}>
      <BusinessPageContent />
    </Suspense>
  );
}
