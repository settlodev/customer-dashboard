"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight, MenuIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DarkModeSwitcher from "./dark-mode-switcher";
import { UserDropdown } from "./user-menu-button";
import { LocationSwitcher } from "./location-switcher";
import { Session } from "next-auth";
import { BusinessPropsType } from "@/types/business/business-props-type";
import { AuthToken, ExtendedUser } from "@/types/types";

interface HeaderProps {
  session: Session | null;
  authToken?: AuthToken | null;
  onMenuClick?: () => void;
  businessData?: BusinessPropsType;
}

const Header = ({ session, authToken, onMenuClick, businessData }: HeaderProps) => {
  // Build a user object from authToken if session is missing
  const user: ExtendedUser | null | undefined = session?.user ?? (authToken ? {
    id: authToken.userId,
    name: `${authToken.firstName} ${authToken.lastName}`.trim(),
    email: authToken.email,
    firstName: authToken.firstName,
    lastName: authToken.lastName,
    avatar: authToken.pictureUrl,
    phoneNumber: authToken.phoneNumber,
    emailVerified: authToken.emailVerified ? new Date() : null,
    isBusinessRegistrationComplete: authToken.isBusinessRegistrationComplete,
    isLocationRegistrationComplete: authToken.isLocationRegistrationComplete,
    accountId: authToken.accountId,
    countryId: authToken.countryId,
    countryCode: authToken.countryCode,
    theme: authToken.theme,
  } as ExtendedUser : null);
  return (
    <header className="z-50 w-full rounded-xl bg-white dark:bg-gray-900">
      <div className="flex h-16 items-center">
        {/* Left: hamburger (mobile) + logo + location switcher */}
        <div className="flex items-center gap-3 pl-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo_new.png"
              alt="Settlo"
              width={120}
              height={40}
              className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </Link>

          {user && businessData && businessData.hasMultipleDestinations && (
            <LocationSwitcher
              locationList={businessData.locationList}
              currentLocation={businessData.currentLocation}
              storeList={businessData.storeList}
              currentStore={businessData.currentStore}
              warehouseList={businessData.warehouseList}
              warehouse={businessData.warehouse}
            />
          )}
        </div>

        {/* Right: nav items */}
        <div className="flex flex-1 items-center justify-end px-4 md:px-6">
          <nav className="flex items-center space-x-2">
            <DarkModeSwitcher />

            {!user && (
              <Button
                asChild
                className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-white rounded-sm transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                <Link href="/login" className="flex items-center">
                  Login
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            )}
          </nav>
        </div>

        {/* Right edge: user dropdown flush to the edge */}
        {user && (
          <div className="flex-shrink-0 h-full">
            <UserDropdown user={user} />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
