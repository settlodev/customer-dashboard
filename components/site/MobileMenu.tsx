// components/MobileMenu.tsx
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin,
  ShoppingCartIcon,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react';
import { BusinessInfo, BusinessType, CategorizedProducts } from '@/types/site/type';

interface MobileMenuProps {
  isMobile: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  businessInfo: BusinessInfo;
  businessType: BusinessType;
  categorizedProducts: CategorizedProducts;
  selectedCategory: string | null;
  handleCategoryClick: (category: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isMobile,
  isMenuOpen,
  setIsMenuOpen,
  businessInfo,
  businessType,
  categorizedProducts,
  selectedCategory,
  handleCategoryClick
}) => {
  if (!isMobile || !isMenuOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-start">
      <div className="bg-white w-4/5 h-full overflow-auto p-4 animate-slide-in-right">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${businessType.primary} flex items-center justify-center mr-2`}>
              <ShoppingCartIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-lg">{businessInfo.name}</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="py-4 border-t border-b border-gray-200 mb-4">
          <h4 className="text-sm font-semibold text-gray-500 mb-3">CONTACT INFORMATION</h4>
          <ul className="space-y-3">
            <li className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              {businessInfo.phone}
            </li>
            <li className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              {businessInfo.email}
            </li>
            <li className="flex items-start text-sm">
              <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
              <span>{businessInfo.address}</span>
            </li>
          </ul>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 mb-3">CATEGORIES</h4>
          <div className="space-y-2">
            {Object.keys(categorizedProducts).map(category => (
              <Button
                key={`mobile-${category}`}
                onClick={() => handleCategoryClick(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`w-full justify-start ${
                  selectedCategory === category 
                    ? `${businessType.primary} text-white`
                    : ""
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 mb-3">QUICK LINKS</h4>
          <ul className="space-y-2">
            <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">Home</a></li>
            <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">About Us</a></li>
            <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">Contact</a></li>
            <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">FAQ</a></li>
          </ul>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-center space-x-4">
            <a href={businessInfo.socials.facebook} className={`${businessType.accent} hover:opacity-80`}>
              <Facebook className="h-5 w-5" />
            </a>
            <a href={businessInfo.socials.instagram} className={`${businessType.accent} hover:opacity-80`}>
              <Instagram className="h-5 w-5" />
            </a>
            <a href={businessInfo.socials.twitter} className={`${businessType.accent} hover:opacity-80`}>
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;