'use client';
import React from 'react';
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
        <div className="mt-4">
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