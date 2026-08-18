"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth-actions";
import Image from "next/image";

interface ExpiredTopBarProps {
  businessName?: string;
  locationName?: string;
}

export function ExpiredTopBar({ businessName, locationName }: ExpiredTopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <Image
          src="/images/settlo.png"
          alt="Settlo"
          width={90}
          height={24}
          className="h-6 w-auto"
        />
        {(businessName || locationName) && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
            <span className="w-px h-4 bg-gray-300" />
            <span>
              {businessName}
              {locationName && (
                <span className="text-gray-400"> / {locationName}</span>
              )}
            </span>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => logout()}
        className="text-gray-600 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </header>
  );
}
