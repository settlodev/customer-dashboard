"use client";
import { AlignJustify, X } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useState} from 'react';



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
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export default function Navbar({ session }: { session: Session | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className='sticky container mx-auto px-3'>
      <div >
      <nav className="flex items-center justify-between lg:max-w-[1280px] lg:mx-auto lg:flex lg:items-center lg:justify-between lg:py-2 lg:px-2 lg:relative mt-3">
      <div className='md:flex md:items-center md:justify-center md:gap-2 lg:flex lg:justify-between lg:items-center lg:gap-4'>
          <div className='lg:flex items-center justify-center'>
          <Link href="/" className='flex items-center justify-center'>
            <img src="/images/logo.png" alt="Logo" className="cursor-pointer h-8 mr-2" loading='lazy' />
            <span className="text-xl font-bold text-black mr-4">SettloPro</span>
          </Link>
          </div>

        {/* Desktop Nav */}
         <div className="hidden md:flex md:gap-2 lg:flex lg:gap-8  lg:items-center lg:justify-center ">
          {desktopList.map((item, key) => (
            <Link
              className='text-[16px] font-medium text-black'
              href={item.href}
              key={key}
            >
              {item.title}
            </Link>
          ))}
         </div>
      </div>
      <div className='hidden md:flex md:items-center md:justify-center md:gap-2 lg:flex  lg:gap-4 lg:justify-center lg:items-center'>
        <Link href="/login">
          <p className='text-[16px] font-medium'>Sign In</p>
        </Link>
        <Link href="/register">
          <button className="border-1 rounded-full pl-3 pr-3 pt-2 pb-2 flex gap-1 items-center bg-emerald-500 text-lime-50 text-[16px] font-medium">
            Get started now
          </button>
        </Link>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden md:hidden flex items-center">
        {/* Toggle Icons */}
        {isOpen ? (
          <X
            color="#50C878"
            className="cursor-pointer z-[999] ml-auto mr-9 "
            onClick={toggleMobileMenu}
          />
        ) : (
          <AlignJustify
            className="cursor-pointer text-gray-800 ml-auto"
            onClick={toggleMobileMenu}
          />
        )}
      </div>
      {/* Mobile Menu */}
      <div
        className={`${isOpen ? 'block' : 'hidden'
          } absolute right-0 top-20 h-full w-full bg-white`}
      >
        <div className="flex h-[310px] w-full flex-col items-center justify-center bg-white p-4 gap-4 fixed top-0 left-0"> {/* Adjusted top value */}
          {mobileList.map((item, key) => (
            <Link
              className={
                key === mobileList.length - 1
                  ? 'border rounded border-emerald-500 px-4 py-2 text-xl font-medium text-emerald-500 hover:bg-emerald-500 hover:text-white'
                  : 'text-xl font-medium text-black'
              }
              href={item.href}
              key={key}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </nav>
      </div>
    </header>
  );
}