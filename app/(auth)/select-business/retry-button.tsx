"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, RefreshCw } from "lucide-react";
import { AlertAction } from "@/components/ui/alert";

export default function RetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <AlertAction onClick={handleRetry} disabled={isPending}>
      {isPending ? (
        <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
      ) : (
        <RefreshCw className="mr-1 h-3 w-3" />
      )}
      Try again
    </AlertAction>
  );
}
