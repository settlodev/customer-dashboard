"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Renders a generic "your package doesn't include this" gate when a
 * route is reached but the entitlement check failed. Used by the
 * Departments page and Department report when DEPARTMENTS_MODULE is
 * not in the entitlement features map.
 */
export function UpgradeGate({
  featureName,
  description,
  recommendedPackage = "Professional",
}: {
  featureName: string;
  description?: string;
  recommendedPackage?: string;
}) {
  return (
    <Card className="mx-auto mt-12 max-w-xl">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">{featureName} is not on your plan</h2>
        <p className="text-sm text-muted-foreground">
          {description ??
            `Upgrade to ${recommendedPackage} or higher to unlock ${featureName.toLowerCase()}.`}
        </p>
        <Button asChild>
          <Link href="/billing">
            <Sparkles className="mr-1.5 h-4 w-4" />
            Upgrade plan
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
