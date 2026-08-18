"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface Props {
  defaultValue: string;
}

export function StaffSearchBox({ defaultValue }: Props) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleChange = (next: string) => {
    setValue(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("search", next);
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="relative w-full sm:w-56">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search by name…"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border bg-muted/30 py-1.5 pl-8 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {value && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base leading-none text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      )}
    </div>
  );
}
