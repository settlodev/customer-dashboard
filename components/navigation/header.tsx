"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight, MenuIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DarkModeSwitcher from "./dark-mode-switcher";
import { UserDropdown } from "./user-menu-button";
import { Session } from "next-auth";

interface HeaderProps {
  session: Session | null;
  onMenuClick?: () => void;
}

const Header = ({ session, onMenuClick }: HeaderProps) => {
  return (
    <header className="z-50 w-full rounded-xl border border-primary/10 bg-white/80 dark:bg-gray-900">
      <div className="flex h-16 items-center">
        {/* Left: hamburger + logo (mobile) */}
        <div className="flex items-center gap-3 pl-4 lg:hidden">
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
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Middle: nav items */}
        <div className="flex flex-1 items-center justify-end px-4 md:px-6">
          <nav className="flex items-center space-x-2">
            <DarkModeSwitcher />

            <div className="hidden md:flex items-center space-x-2">
              {/*<DropdownNotification />*/}
              {/*<DropdownMessage />*/}
            </div>

            {!session?.user && (
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
        {session && (
          <div className="flex-shrink-0 h-full">
            <UserDropdown user={session.user} />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
