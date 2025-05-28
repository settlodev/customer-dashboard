// components/Footer.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCartIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  // Facebook,
  // Instagram,
  // Twitter
} from 'lucide-react';
import { BusinessInfo, BusinessType } from '@/types/site/type';

interface FooterProps {
  businessInfo: BusinessInfo;
  businessType: BusinessType;
}

const Footer: React.FC<FooterProps> = ({ businessInfo, businessType }) => {
  return (
    <footer className="bg-gray-800 text-white mt-8">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* About Section */}
        <div>
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 rounded-full ${businessType.primary} flex items-center justify-center mr-2`}>
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-bold text-xl">{businessInfo?.name}</h2>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            {businessInfo?.tagline}
          </p>
          {/* <div className="flex space-x-3 mb-4">
            <a href={businessInfo.socials.facebook} className="hover:text-gray-300">
              <Facebook className="h-5 w-5" />
            </a>
            <a href={businessInfo.socials.instagram} className="hover:text-gray-300">
              <Instagram className="h-5 w-5" />
            </a>
            <a href={businessInfo.socials.twitter} className="hover:text-gray-300">
              <Twitter className="h-5 w-5" />
            </a>
          </div> */}
        </div>
        
        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#" className="hover:text-white">Home</a></li>
            <li><a href="#" className="hover:text-white">About Us</a></li>
            <li><a href="#" className="hover:text-white">Products</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
            <li><a href="#" className="hover:text-white">FAQ</a></li>
          </ul>
        </div>
        
        {/* Contact Info */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{businessInfo?.address}</span>
            </li>
            <li className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              <span>{businessInfo?.phone}</span>
            </li>
            <li className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              <span>{businessInfo?.email}</span>
            </li>
            <li className="flex items-start">
              <Clock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{businessInfo?.hours}</span>
            </li>
          </ul>
        </div>
        
        {/* Newsletter Subscription */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Newsletter</h3>
          <p className="text-gray-300 text-sm mb-3">
            Subscribe to receive updates on new products and special promotions
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Your email"
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Button className={businessType.primary}>
              Subscribe
            </Button>
          </div>
        </div>
      </div>
      
      {/* Copyright Notice */}
      <div className="border-t border-gray-700">
        <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {businessInfo?.name}. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;