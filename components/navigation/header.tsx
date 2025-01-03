"use client"

import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {ChevronRight, MenuIcon} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DarkModeSwitcher from "./dark-mode-switcher";
import {UserDropdown} from "./user-menu-button";
import {Session} from "next-auth";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  session: Session | null;
}

const Header = ({sidebarOpen, setSidebarOpen, session}: HeaderProps) => {
  return (
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 lg:hidden">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <MenuIcon className="h-6 w-6"/>
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
            </Sheet>

            <Link href="/" className="flex items-center space-x-2">
              <Image
                  src="/images/logo.png"
                  alt="Settlo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
              />
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <DarkModeSwitcher/>

              <div className="hidden md:flex items-center space-x-2">
                {/*<DropdownNotification />*/}
                {/*<DropdownMessage />*/}
              </div>

              {(!session?.user) &&
                  <Button
                      asChild
                      className="hidden md:inline-flex bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                  >
                    <Link href="/login" className="flex items-center">
                      Login
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"/>
                    </Link>
                  </Button>
              }

              { session &&  <UserDropdown user={session.user}/> }
            </nav>
          </div>
        </div>
      </header>
  );
};

export default Header;
