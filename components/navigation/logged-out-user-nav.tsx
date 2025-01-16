import Link from 'next/link';
import Image from 'next/image';
import {MenuIcon, ShieldQuestion, ChevronRight} from 'lucide-react';
import {Button} from "@/components/ui/button";
import {UserDropdown} from "@/components/navigation/user-menu-button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import DarkModeSwitcher from "./dark-mode-switcher";
import {auth} from "@/auth";

const navigationLinks = [
    {title: "Solutions", href: "/#solutions"},
    {title: "Pricing", href: "/#pricing"},
    {title: "Shops", href: "/#shops"},
    {title: "Resources", href: "/#resources"},
    {title: "Contact", href: "/#contact"},
];

interface LoggedOutNavbarProps {
    hideLogin?: boolean;
}

export async function LoggedOutNavbar({hideLogin}: LoggedOutNavbarProps) {
    const session = await auth();
    


    const MobileNav = () => (
        <SheetContent side="left" className="w-72">
            <div className="flex flex-col gap-4 mt-8">
                {navigationLinks.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className="flex items-center p-2 hover:bg-accent rounded-sm transition-colors text-foreground/80 hover:text-foreground"
                    >
                        <span>{item.title}</span>
                    </Link>
                ))}

                <div className="h-px bg-border my-4"/>

                <Link
                    href="mailto:support@settlo.co.tz"
                    className="flex items-center p-2 hover:bg-accent rounded-sm transition-colors"
                >
                    <ShieldQuestion className="h-5 w-5"/>
                    <span className="ml-2">Help</span>
                </Link>

                {!hideLogin && (
                    <Button
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm"
                        asChild
                    >
                        <Link href="/login" className="flex items-center justify-center">
                            <span>Login</span>
                            <ChevronRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                )}
            </div>
        </SheetContent>
    );

    return (
        <header
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto">
                <div className="flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <MenuIcon className="h-6 w-6"/>
                                    <span className="sr-only">Toggle navigation menu</span>
                                </Button>
                            </SheetTrigger>
                            <MobileNav/>
                        </Sheet>

                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="relative h-10 w-10 transition-transform duration-200 group-hover:scale-105">
                                <Image
                                    src="/images/logo.png"
                                    alt="Settlo"
                                    fill
                                    sizes="32px"
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span
                                className="hidden md:inline-block font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                                Settlo
                            </span>
                        </Link>

                        <nav className="hidden lg:flex items-center space-x-6 ml-6">
                            {navigationLinks.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {item.title}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        <DarkModeSwitcher/>

                        <Link
                            href="mailto:support@settlo.co.tz"
                            className="hidden md:flex items-center text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <ShieldQuestion className="h-5 w-5 group-hover:text-emerald-500"/>
                            <span className="ml-2 font-medium">Help</span>
                        </Link>

                        {(!session?.user && !hideLogin) &&
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

                        {/* { session && currentLocation !== undefined &&  (
                            <div>
                                <Link href="/dashboard" className="hidden md:flex items-center text-muted-foreground hover:text-foreground transition-colors group">My Dashboard</Link>
                            </div>
                        ) } */}

                        { session &&  <UserDropdown user={session.user}/> }
                    </div>
                </div>
            </div>
        </header>
    );
}
