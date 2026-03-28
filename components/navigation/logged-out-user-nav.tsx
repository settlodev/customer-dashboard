import Link from "next/link";
import Image from "next/image";
import { MenuIcon, ShieldQuestion, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/navigation/user-menu-button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getAuthToken } from "@/lib/auth-utils";
import { ExtendedUser } from "@/types/types";

const navigationLinks = [
  { title: "Features", href: "/#features" },
  { title: "Pricing", href: "/#pricing" },
  { title: "Testimonials", href: "/#testimonials" },
  { title: "FAQS", href: "/#faqs" },
  { title: "Contact us", href: "/#contacts" },
];

interface LoggedOutNavbarProps {
  hideLogin?: boolean;
}

export async function LoggedOutNavbar({ hideLogin }: LoggedOutNavbarProps) {
  const authToken = await getAuthToken();

  const user: ExtendedUser | null = authToken ? {
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
  } as ExtendedUser : null;

  const MobileNav = () => (
    <SheetContent side="left" className="w-72 p-0">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <Image
            src="/images/logo_new.png"
            alt="Settlo"
            width={100}
            height={32}
            className="h-8 w-auto object-contain"
          />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigationLinks.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center px-3 py-2.5 rounded-lg hover:bg-primary/10 text-gray-700 dark:text-gray-300 hover:text-primary transition-colors text-sm font-medium"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="border-t px-3 py-4 space-y-2">
          <Link
            href="mailto:support@settlo.co.tz"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-primary/10 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors text-sm"
          >
            <ShieldQuestion className="h-4 w-4" />
            <span>Help & Support</span>
          </Link>

          {!hideLogin && !user && (
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg"
              asChild
            >
              <Link href="/login" className="flex items-center justify-center">
                <span>Login</span>
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </SheetContent>
  );

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-white/60 dark:bg-gray-950/60 backdrop-blur-lg">
        <div className="w-full px-4 md:px-6 lg:container lg:mx-auto">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <MenuIcon className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <MobileNav />
              </Sheet>

              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logo_new.png"
                  alt="Settlo"
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>

              <nav className="hidden lg:flex items-center ml-8">
                <div className="flex items-center gap-1">
                  {navigationLinks.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="px-3.5 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary rounded-md transition-all duration-150"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="mailto:support@settlo.co.tz"
                className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ShieldQuestion className="h-4 w-4" />
                <span className="font-medium">Help</span>
              </Link>

              {!user && !hideLogin && (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="hidden sm:inline-flex text-sm font-medium"
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm transition-all duration-200"
                  >
                    <Link href="/register" className="flex items-center text-sm">
                      Get Started
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}

              {user && <UserDropdown user={user} />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
