"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BillingLookupFormProps {
  initialValue?: string;
  inline?: boolean;
}

export function BillingLookupForm({
  initialValue = "",
  inline = false,
}: BillingLookupFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    startTransition(() => {
      router.push(trimmed ? `/billing?businessId=${trimmed}` : "/billing");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        inline
          ? "flex w-full items-center gap-2 md:w-auto"
          : "flex flex-col gap-2 rounded-lg border border-line bg-card p-5 md:flex-row md:items-center"
      }
    >
      <div className="relative flex-1 md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Business ID (UUID)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-9 font-mono text-[12px]"
        />
      </div>
      <Button type="submit" disabled={isPending} size={inline ? "sm" : undefined}>
        Look up
      </Button>
    </form>
  );
}
