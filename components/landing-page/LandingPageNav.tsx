"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlignJustify, X, UserIcon, ShieldQuestion } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { useCurrentUser } from "@/hooks/use-current-user";
import {signOut} from "next-auth/react";

const desktopList = [
    { title: "Solutions", href: "/solutions" },
    { title: "Pricing", href: "/pricing" },
    { title: "Solutions", href: "/solutions" },
    { title: "Shops", href: "/shops" },
    { title: "Resources", href: "/resources" },
    { title: "Contact", href: "/contact" },
];

const mobileList = [
    { title: "Home", href: "/" },
    { title: "Features", href: "/services" },
    { title: "About Us", href: "/about" },
    { title: "Solutions", href: "/solutions" },
    { title: "Shops", href: "/shops" },
    { title: "Book A Demo", href: "/contact" }
];

const LandingPageNav = () => {
    const [isOpen, setIsOpen] = useState(false);
    const user = useCurrentUser();

    const toggleMobileMenu = () => {
        setIsOpen(!isOpen);
    };

    const doLogout = async () => {
        await signOut();
        //window.location.reload();
    };

    return (
        <header className="sticky top-0 w-full bg-white border-b border-gray-200">
            <nav className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <div className="relative h-8 w-8 mr-2">
                                <Image
                                    src="/images/logo.png"
                                    alt="Logo"
                                    fill
                                    sizes="32px"
                                    className="cursor-pointer object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-xl font-bold text-black">Settlo Pro</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-8">
                        {desktopList.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className="text-gray-700 hover:text-emerald-500 font-medium"
                            >
                                {item.title}
                            </Link>
                        ))}

                        {/* Auth Section */}
                        {user? (
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center border border-emerald-500 rounded-full px-4 py-2 text-emerald-500">
                                    <UserIcon size={20} className="mr-2" />
                                    <span className="font-medium">
                                        {user.firstName} {user.lastName}
                                    </span>
                                </div>
                                <button
                                    onClick={doLogout}
                                    className="flex items-center text-gray-700 hover:text-emerald-500 font-medium"
                                >
                                    Logout
                                    <ChevronRight className="ml-1" size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link href="mailto:support@settlo.co.tz" className="flex items-center text-gray-700 hover:text-emerald-500">
                                    <ShieldQuestion size={22} className="mr-2" />
                                    <span className="font-medium">Help</span>
                                </Link>
                                <Link
                                    href="/login"
                                    className="flex items-center bg-emerald-500 text-white rounded-full px-4 py-2 font-medium hover:bg-emerald-600"
                                >
                                    Login
                                    <ChevronRight className="ml-1" size={20} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden">
                        <button onClick={toggleMobileMenu} className="text-gray-700">
                            {isOpen ? (
                                <X size={24} className="text-emerald-500" />
                            ) : (
                                <AlignJustify size={24} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="lg:hidden fixed inset-0 top-16 bg-white z-50">
                        <div className="flex flex-col items-center pt-8 space-y-4">
                            {mobileList.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className="text-xl font-medium text-gray-700 hover:text-emerald-500"
                                >
                                    {item.title}
                                </Link>
                            ))}

                                {user ? (
                                    <>
                                    <div className="flex items-center border border-emerald-500 rounded-full px-4 py-2 text-emerald-500">
                                        <UserIcon size={20} className="mr-2" />
                                        <span className="font-medium">
                                            {user.firstName} {user.lastName}
                                        </span>
                                    </div>
                                    <button
                                        onClick={doLogout}
                                        className="flex items-center text-gray-700 hover:text-emerald-500 font-medium"
                                    >
                                        Logout
                                        <ChevronRight className="ml-1" size={20} />
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex items-center bg-emerald-500 text-white rounded-full px-4 py-2 font-medium"
                                >
                                    Login
                                    <ChevronRight className="ml-1" size={20} />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default LandingPageNav;
