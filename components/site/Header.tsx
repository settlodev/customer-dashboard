// components/Header.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Heart, 
  ShoppingCart, 
  User,
  Menu,
  Search,
  ShoppingCartIcon,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react';
import { BusinessInfo, BusinessType } from '@/types/site/type';


interface HeaderProps {
  businessInfo: BusinessInfo;
  businessType: BusinessType;
  isMobile: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  cartCount: number;
  wishlistCount: number;
  setIsMenuOpen: (open: boolean) => void;
  isMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({
  businessInfo,
  businessType,
  isMobile,
  searchQuery,
  setSearchQuery,
  handleSearch,
  cartCount,
  wishlistCount,
  setIsMenuOpen,
  isMenuOpen
}) => {
  return (
    <>
      {/* Top Bar - Business Info */}
      <div className={`w-full py-2 px-4 ${businessType.primary} text-white hidden md:block`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex space-x-4 text-sm">
            <span className="flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {businessInfo.phone}
            </span>
            <span className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {businessInfo.address}
            </span>
          </div>
          <div className="flex space-x-4 text-sm">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {businessInfo.hours}
            </span>
            {/* <div className="flex space-x-2">
              <a href={businessInfo.socials.facebook} className="hover:text-gray-200">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={businessInfo.socials.instagram} className="hover:text-gray-200">
                <Instagram className="h-4 w-4" />
              </a>
              <a href={businessInfo.socials.twitter} className="hover:text-gray-200">
                <Twitter className="h-4 w-4" />
              </a>
            </div> */}
          </div>
        </div>
      </div>
      
      {/* Main Header */}
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex justify-between items-center">
            {/* Logo and Business Name */}
            <div className="flex items-center space-x-2">
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className="md:hidden"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              )}
              
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full ${businessType.primary} flex items-center justify-center mr-2`}>
                  <ShoppingCartIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl">{businessInfo.name}</h1>
                  <p className="text-xs text-gray-500 hidden md:block">
                    {businessInfo.tagline}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Search on Desktop */}
            <div className="hidden md:flex flex-1 mx-8">
              <div className="relative flex-grow max-w-md mx-auto">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pr-10"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
                <button 
                  onClick={handleSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <Search className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Action Icons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => alert('Account')}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative" onClick={() => alert('Wishlist')}>
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className={`absolute -top-1 -right-1 ${businessType.primary} text-white rounded-full text-xs w-4 h-4 flex items-center justify-center`}>
                    {wishlistCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="relative" onClick={() => alert('Cart')}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 ${businessType.primary} text-white rounded-full text-xs w-4 h-4 flex items-center justify-center`}>
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Mobile Search */}
          <div className="mt-4 md:hidden">
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pr-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button 
                onClick={handleSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <Search className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;