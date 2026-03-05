"use client";

import * as Sentry from "@sentry/nextjs";
import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Building2,
  Loader2Icon,
  Search,
  ChevronRight,
  Globe2,
} from "lucide-react";
import { Business } from "@/types/business/type";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { refreshBusiness } from "@/lib/actions/business/refresh";

const BusinessList = ({ businesses }: { businesses: Business[] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  // Auto-redirect if only one business
  useEffect(() => {
    
    if (businesses.length === 1 && !isLoading && !isRedirecting) {
      
      handleBusinessSelect(businesses[0], 0);
    }
  }, [businesses]);

  useEffect(() => {
    return () => {
      setIsLoading(false);
      setPendingIndex(null);
    };
  }, []);

  const handleBusinessSelect = useCallback(
    async (selectedBusiness: Business, index: number) => {
      if (isLoading || isRedirecting) return;

      setPendingIndex(index);
      setIsLoading(true);

      try {
        setIsRedirecting(true);

        await refreshBusiness(selectedBusiness);

        router.push(`/select-location`);
        return;
      } catch (error) {
        Sentry.captureException(error);

        // Reset states only if there's an error
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

  const filteredBusinesses = businesses.filter((bus) =>
    bus.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Show loading state when auto-redirecting single business
  if (businesses.length === 1 && (isLoading || isRedirecting)) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
        <Loader2Icon className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-emerald-600 font-medium">
          Setting up your business...
        </p>
      </div>
    );
  }

  return (
    <section className="relative">
      {isRedirecting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
          <Loader2Icon className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-emerald-600 font-medium">Redirecting...</p>
        </div>
      )}

      <Card className="w-full mx-auto max-w-md mt-10 lg:mt-0 md:mt-0">
        <CardHeader className="text-center pb-2">
          <CardTitle>Select Your Business</CardTitle>
          <CardDescription>
            Get started by selecting your business
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative flex-1 mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search businesses..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-100">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="divide-y divide-gray-100"
            >
              {filteredBusinesses.map((bus, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1 },
                  }}
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        {bus.logo ? (
                          <Image
                            src={bus.logo}
                            alt={bus.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {bus.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Globe2 className="w-4 h-4 mr-1" />
                          <span>
                            {bus.countryName} • {bus.totalLocations}{" "}
                            {bus.totalLocations === 1
                              ? "location"
                              : "locations"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBusinessSelect(bus, index)}
                      disabled={isLoading || isRedirecting}
                      className={cn(
                        "px-4 py-2 rounded-sm",
                        "text-sm font-medium",
                        "transition-all duration-200",
                        "flex items-center space-x-2",
                        pendingIndex === index
                          ? "bg-gray-100 text-gray-400"
                          : "bg-emerald-500 text-white hover:bg-emerald-600",
                      )}
                    >
                      {pendingIndex === index ? (
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Select</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default BusinessList;
