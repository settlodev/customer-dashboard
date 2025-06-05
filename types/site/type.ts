// types.ts
import { Product } from '@/types/product/type';

export type CategorizedProducts = {
  [key: string]: Product[];
};

export interface ExtendedProduct extends Omit<Product, 'categoryName'> {
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  price?: string | number;
  categoryName: string;
}

export interface BusinessInfo {
  name: string;
  tagline: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  socials: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
  businessType: string;
}

export interface BusinessType {
  primary: string;
  secondary: string;
  accent: string;
  icon: string;
}

// constants.ts
export const categoryColors = {
  backgrounds: [
    'bg-[#0088FE]',
    'bg-[#00C49F]',
    'bg-[#FFBB28]',
    'bg-[#FF8042]',
    'bg-[#8884D8]',
  ],
  text: [
    'text-[#FFF]',
  ],
  accent: [
    'bg-[#0088FE]',
    'bg-[#00C49F]',
    'bg-[#FFBB28]',
    'bg-[#FF8042]',
    'bg-[#8884D8]',
  ]
};

export const businessTypes = {
  salon: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-100',
    accent: 'text-purple-600',
    icon: 'scissors'
  },
  spa: {
    primary: 'bg-teal-600',
    secondary: 'bg-teal-100',
    accent: 'text-teal-600',
    icon: 'heart'
  },
  retail: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-100',
    accent: 'text-blue-600',
    icon: 'shopping-bag'
  },
  butchery: {
    primary: 'bg-red-600',
    secondary: 'bg-red-100',
    accent: 'text-red-600',
    icon: 'scissors'
  },
  supermarket: {
    primary: 'bg-green-600',
    secondary: 'bg-green-100',
    accent: 'text-green-600',
    icon: 'shopping-cart'
  },
  restaurant: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-100',
    accent: 'text-orange-600',
    icon: 'utensils'
  },
  hotel: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-100',
    accent: 'text-indigo-600',
    icon: 'bed'
  },
  bar: {
    primary: 'bg-amber-600',
    secondary: 'bg-amber-100',
    accent: 'text-amber-600',
    icon: 'wine'
  },
  default: {
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-100',
    accent: 'text-emerald-600',
    icon: 'store'
  }
};

export const businessInfo: BusinessInfo = {
  name: "Big Genge",
  tagline: "Quality Products, Exceptional Service",
  logo: "/logo.png",
  phone: "+255 123 456 789",
  email: "info@biggenge.com",
  address: "123 Market Street, Dar es Salaam, Tanzania",
  hours: "Mon-Sat: 8am - 8pm, Sun: 10am - 6pm",
  socials: {
    instagram: "https://instagram.com/biggenge",
    facebook: "https://facebook.com/biggenge",
    twitter: "https://twitter.com/biggenge"
  },
  businessType: "spa"
};