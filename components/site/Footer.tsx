'use client';
import React from 'react';
import Image from "next/image";
import { BusinessInfo, BusinessType } from '@/types/site/type';

interface FooterProps {
  businessInfo: BusinessInfo;
  businessType: BusinessType;
}

const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-gray-800 text-white mt-8">


      {/* Copyright Notice */}
      <div className="border-t border-gray-700">
        <div className=" flex justify-center mt-4 items-center">
          <Image
            src="/images/logo.png"
            alt="Settlo Technologies Limited"
            width={50}
            height={50}
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-110"
          />
          <p className="text-white font-bold text-lg text-center">Powered by Settlo</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} Settlo Technologies Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;