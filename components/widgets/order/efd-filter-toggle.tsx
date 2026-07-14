"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2 } from "lucide-react";

const EfdFilterToggle = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get("efdPrinted");
  const isAllActive = current === null || current === undefined;
  const isEfdActive = current === "true";

  const setFilter = (value: "true" | "false" | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete("efdPrinted");
    } else {
      params.set("efdPrinted", value);
    }
    // Reset to page 1 when filter changes
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isAllActive ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter(null)}
        disabled={isPending}
      >
        {isPending && !isAllActive ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : null}
        All
      </Button>
      <Button
        variant={isEfdActive ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter("true")}
        disabled={isPending}
      >
        {isPending && !isEfdActive ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <Receipt className="w-4 h-4 mr-1.5" />
        )}
        EFD only
      </Button>
    </div>
  );
};

export default EfdFilterToggle;
