import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DarkModeSwitcher from "./dark-mode-switcher";
import DropdownUser from "./user-menu-button";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  return (
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 lg:hidden">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <MenuIcon className="h-6 w-6" />
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
              <DarkModeSwitcher />

              <div className="hidden md:flex items-center space-x-2">
                {/*<DropdownNotification />*/}
                {/*<DropdownMessage />*/}
              </div>

              <DropdownUser />
            </nav>
          </div>
        </div>
      </header>
  );
};

export default Header;
