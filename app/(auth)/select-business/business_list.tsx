"use client";

import * as Sentry from "@sentry/nextjs";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2Icon, ChevronRight, Globe2 } from "lucide-react";
import { Business } from "@/types/business/type";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { refreshBusiness } from "@/lib/actions/business/refresh";
import { switchToLocation } from "@/lib/actions/destination";
import { fetchAllLocations } from "@/lib/actions/location-actions";

const BusinessList = ({ businesses }: { businesses: Business[] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const autoSelectRan = useRef(false);

  // Auto-select if only one business
  useEffect(() => {
    if (businesses.length === 1 && !autoSelectRan.current) {
      autoSelectRan.current = true;
      handleBusinessSelect(businesses[0], 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBusinessSelect = useCallback(
    async (selectedBusiness: Business, index: number) => {
      if (isLoading || isRedirecting) return;

      setPendingIndex(index);
      setIsLoading(true);
      setIsRedirecting(true);

      try {
        await refreshBusiness(selectedBusiness);

        // Check if this business has only one location — skip select-location
        const locations = await fetchAllLocations();

        if (locations && locations.length === 1) {
          // Single location — go straight to dashboard
          await switchToLocation(locations[0]);
          window.location.href = "/dashboard";
          return;
        }

        // Multiple locations or none — go to select-location
        router.push("/select-location");
      } catch (error) {
        // Re-throw redirects (Next.js routing throws)
        if (
          error instanceof Error &&
          "digest" in error &&
          typeof (error as any).digest === "string" &&
          (error as any).digest.startsWith("NEXT_REDIRECT")
        ) {
          throw error;
        }

        Sentry.captureException(error);
        setIsRedirecting(false);
        setIsLoading(false);
        setPendingIndex(null);

        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load business details. Please try again.",
        });
      }
    },
    [isLoading, isRedirecting, toast, router],
  );

  // Show loading while auto-selecting single business
  if (businesses.length === 1 && (isLoading || isRedirecting)) {
    return (
      <div className="flex items-center justify-center flex-col gap-3 py-20">
        <Loader2Icon className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-primary font-medium">
          Setting up your business...
        </p>
      </div>
    );
  }

  return (
    <section className="relative">
      <div className="relative w-full max-w-md mx-auto">
        {isRedirecting && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm z-30 rounded-xl flex items-center justify-center flex-col gap-3">
            <Loader2Icon className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-primary font-medium">Redirecting...</p>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Select Your Business
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get started by selecting your business
          </p>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {businesses.map((bus, index) => (
            <button
              key={index}
              onClick={() => handleBusinessSelect(bus, index)}
              disabled={isLoading || isRedirecting}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                pendingIndex === index
                  ? "border-primary/30 bg-primary/5"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {bus.logoUrl ? (
                  <Image
                    src={bus.logoUrl}
                    alt={bus.name}
                    width={44}
                    height={44}
                    className="rounded-xl object-cover"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {bus.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>
                    {bus.businessTypeName}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {pendingIndex === index ? (
                  <Loader2Icon className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BusinessList;
